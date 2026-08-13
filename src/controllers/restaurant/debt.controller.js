// controllers/restaurant/debt.controller.js
const pool = require('../../config/db');
const AppError = require('../../utils/AppError');
const debtService = require('../../services/restaurant/debtService');

// ─── GÉNÉRER UN NUMÉRO DE VENTE ─────────────────────────
const generateSaleNumber = async (connection, companyId) => {
    const date = new Date();
    const prefix = `RES-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    const [rows] = await connection.query(
        "SELECT sale_number FROM sales WHERE company_id = ? AND sale_number LIKE ? ORDER BY id DESC LIMIT 1",
        [companyId, `${prefix}%`]
    );
    let sequence = 1;
    if (rows.length > 0) {
        const lastSeq = parseInt(rows[0].sale_number.split('-').pop());
        sequence = lastSeq + 1;
    }
    return `${prefix}-${String(sequence).padStart(5, '0')}`;
};

// ─── CRÉER UNE DETTE (CRÉE LA VENTE D'ABORD) ────────────
const createDebt = async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const {
            client_id,
            items,
            discount_type = 'none',
            discount_value = 0,
            amount_paid = 0,
            payment_method = 'cash',
            payment_reference = null,
            due_date = null,
            notes = null,
        } = req.body;
        const companyId = req.company.id;
        const userId = req.user.id;

        // 1. Valider le client (obligatoire pour une dette)
        if (!client_id) {
            throw new AppError('Un client est obligatoire pour une vente à crédit.', 400);
        }

        const client = await debtService.validateClient(connection, client_id, companyId);

        // 2. Valider les plats
        if (!items || items.length === 0) {
            throw new AppError('Au moins un plat est requis.', 400);
        }

        let subtotal = 0;
        const saleItemsData = [];

        for (const item of items) {
            const [products] = await connection.query(
                `SELECT id, company_id, cost_price, retail_price, wholesale_price, name
         FROM products WHERE id = ? AND product_type = 'dish' AND deleted_at IS NULL`,
                [item.product_id]
            );

            if (products.length === 0) {
                throw new AppError(`Plat ID ${item.product_id} introuvable.`, 404);
            }

            const product = products[0];

            if (product.company_id !== companyId) {
                throw new AppError(`Le plat "${product.name}" n'appartient pas à ce restaurant.`, 403);
            }

            const unitPrice = parseFloat(item.unit_price !== undefined ? item.unit_price : product.retail_price);
            if (isNaN(unitPrice) || unitPrice < 0) {
                throw new AppError("Le prix unitaire ne peut pas être négatif.", 400);
            }
            const quantity = parseFloat(item.quantity);
            if (isNaN(quantity) || quantity <= 0) {
                throw new AppError("La quantité de chaque plat doit être supérieure à 0.", 400);
            }
            const totalPrice = unitPrice * quantity;
            subtotal += totalPrice;

            saleItemsData.push({ product, item: { ...item, unit_price: unitPrice, quantity }, totalPrice });
        }

        // 3. Calculer remise et total
        let discountAmount = 0;
        if (discount_type === 'percentage') {
            const discVal = parseFloat(discount_value);
            if (isNaN(discVal) || discVal < 0 || discVal > 100) {
                throw new AppError("Le pourcentage de remise doit être compris entre 0 et 100%.", 400);
            }
            discountAmount = subtotal * (discVal / 100);
        } else if (discount_type === 'fixed') {
            const discVal = parseFloat(discount_value);
            if (isNaN(discVal) || discVal < 0) {
                throw new AppError("Le montant de la remise fixe ne peut pas être négatif.", 400);
            }
            discountAmount = discVal;
        }

        const totalAmount = subtotal - discountAmount;
        if (isNaN(totalAmount) || totalAmount <= 0) {
            throw new AppError("Impossible d'enregistrer cette dette. Le montant total doit être supérieur à 0 FCFA. Vérifiez les prix des plats.", 400);
        }

        const paid = parseFloat(amount_paid || 0);
        const amountDue = totalAmount - paid;

        // 4. Créer la vente
        const saleNumber = await generateSaleNumber(connection, companyId);

        const [saleResult] = await connection.query(
            `INSERT INTO sales (
        company_id, sale_number, client_id, client_name,
        subtotal, discount_amount, discount_type, discount_value,
        tax_amount, total_amount, payment_status, amount_paid, amount_due,
        payment_method, payment_reference, status, seller_id, notes, sale_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, NOW())`,
            [
                companyId, saleNumber, client_id, client.full_name,
                subtotal, discountAmount, discount_type, discount_value || null,
                totalAmount, paid >= totalAmount ? 'paid' : 'debt', paid, amountDue,
                payment_method, payment_reference || null,
                userId, notes || null,
            ]
        );
        const saleId = saleResult.insertId;

        // 5. Créer les sale_items (pas de gestion de stock pour les plats)
        for (const data of saleItemsData) {
            const { product, item, totalPrice } = data;

            await connection.query(
                `INSERT INTO sale_items (
          sale_id, product_id, quantity, price_type, unit_price,
          retail_price_ref, wholesale_price_ref, total_price,
          discount_amount, cost_price, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
                [
                    saleId, item.product_id, item.quantity,
                    item.price_type || 'retail', item.unit_price,
                    product.retail_price, product.wholesale_price, totalPrice,
                    product.cost_price, item.notes || null,
                ]
            );
        }

        // 6. Créer la dette si montant dû > 0
        let debt = null;
        if (amountDue > 0) {
            const debtStatus = paid > 0 ? 'partial' : 'pending';

            const [debtResult] = await connection.query(
                `INSERT INTO client_debts (company_id, client_id, sale_id, total_amount, remaining_amount, status, due_date, notes, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [companyId, client_id, saleId, totalAmount, amountDue, debtStatus, due_date || null, notes || null, userId]
            );
            const debtId = debtResult.insertId;

            // 7. Enregistrer le paiement initial si > 0
            if (paid > 0) {
                await connection.query(
                    `INSERT INTO debt_payments (company_id, client_debt_id, amount, payment_method, payment_reference, payment_date, received_by, note)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [companyId, debtId, paid, payment_method, payment_reference || null, new Date().toISOString().split('T')[0], userId, 'Paiement initial']
                );
            }

            await debtService.recalculateClientDebt(connection, client_id, companyId);
            debt = await debtService.getEnrichedDebtById(connection, debtId, companyId);

            const [saleItems] = await connection.query(
                `SELECT si.*, p.name as product_name, p.image_url
         FROM sale_items si JOIN products p ON si.product_id = p.id
         WHERE si.sale_id = ?`,
                [saleId]
            );
            debt.sale_items = saleItems;
        }

        // Mettre à jour les stats client
        await connection.query(
            `UPDATE clients SET
        total_purchases = total_purchases + ?,
        total_purchase_count = total_purchase_count + 1,
        last_purchase_at = NOW()
       WHERE id = ?`,
            [totalAmount, client_id]
        );

        await connection.commit();

        res.status(201).json({
            success: true,
            message: amountDue > 0 ? 'Vente à crédit créée.' : 'Vente créée (payée intégralement).',
            data: {
                sale_id: saleId,
                sale_number: saleNumber,
                total_amount: totalAmount,
                amount_paid: paid,
                amount_due: amountDue,
                debt,
            },
        });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

// ─── LISTER LES DETTES ──────────────────────────────────
const getDebts = async (req, res, next) => {
    try {
        const companyId = req.company.id;
        const {
            page = 1, limit = 20, status, client_id, search, overdue,
            start_date, end_date, sort_by = 'created_at', sort_order = 'DESC',
        } = req.query;

        let query = `
      SELECT cd.*,
             c.full_name as client_name, c.phone as client_phone,
             s.sale_number, s.total_amount as sale_total, s.sale_date,
             (SELECT COUNT(*) FROM debt_payments dp WHERE dp.client_debt_id = cd.id) as payments_count,
             (SELECT COALESCE(SUM(dp.amount), 0) FROM debt_payments dp WHERE dp.client_debt_id = cd.id) as total_paid
      FROM client_debts cd
      JOIN clients c ON cd.client_id = c.id
      LEFT JOIN sales s ON cd.sale_id = s.id
      WHERE cd.company_id = ?
    `;
        const queryParams = [companyId];

        if (status) { query += ' AND cd.status = ?'; queryParams.push(status); }
        if (client_id) { query += ' AND cd.client_id = ?'; queryParams.push(client_id); }
        if (overdue === 'true') {
            query += ' AND cd.due_date IS NOT NULL AND cd.due_date < CURDATE() AND cd.status NOT IN ("paid", "canceled")';
        }
        if (start_date) { query += ' AND DATE(cd.created_at) >= ?'; queryParams.push(start_date); }
        if (end_date) { query += ' AND DATE(cd.created_at) <= ?'; queryParams.push(end_date); }
        if (search) {
            query += ' AND (c.full_name LIKE ? OR c.phone LIKE ? OR s.sale_number LIKE ?)';
            const s = `%${search}%`;
            queryParams.push(s, s, s);
        }

        const countQuery = query.replace(/SELECT cd\.\*,.*FROM/s, 'SELECT COUNT(*) as total FROM');
        const [countResult] = await pool.query(countQuery, queryParams);
        const total = countResult[0].total;

        const allowed = ['created_at', 'total_amount', 'remaining_amount', 'due_date'];
        const sortCol = allowed.includes(sort_by) ? sort_by : 'created_at';
        const order = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        query += ` ORDER BY cd.${sortCol} ${order}`;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        query += ' LIMIT ? OFFSET ?';
        queryParams.push(parseInt(limit), offset);

        const [debts] = await pool.query(query, queryParams);

        // Items pour chaque dette
        for (const debt of debts) {
            if (debt.sale_id) {
                const [items] = await pool.query(
                    `SELECT si.*, p.name as product_name, p.image_url
           FROM sale_items si JOIN products p ON si.product_id = p.id
           WHERE si.sale_id = ?`,
                    [debt.sale_id]
                );
                debt.sale_items = items;
            }
        }

        res.status(200).json({
            success: true,
            data: { debts },
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
        });
    } catch (error) {
        next(error);
    }
};

// ─── DÉTAIL D'UNE DETTE ────────────────────────────────
const getDebtById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const companyId = req.company.id;

        const debt = await debtService.getEnrichedDebtById(pool, id, companyId);
        if (!debt) throw new AppError('Dette introuvable.', 404);

        const [payments] = await pool.query(
            `SELECT dp.*, u.first_name as received_by_name
       FROM debt_payments dp
       LEFT JOIN users u ON dp.received_by = u.id
       WHERE dp.client_debt_id = ?
       ORDER BY dp.payment_date DESC`,
            [id]
        );

        if (debt.sale_id) {
            const [items] = await pool.query(
                `SELECT si.*, p.name as product_name, p.image_url
         FROM sale_items si JOIN products p ON si.product_id = p.id
         WHERE si.sale_id = ?`,
                [debt.sale_id]
            );
            debt.sale_items = items;
        }

        res.status(200).json({
            success: true,
            data: { debt: { ...debt, payments } },
        });
    } catch (error) {
        next(error);
    }
};

// ─── MODIFIER UNE DETTE ─────────────────────────────────
const updateDebt = async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const companyId = req.company.id;
        const { total_amount, due_date, notes, status } = req.body;

        const [debts] = await connection.query(
            'SELECT * FROM client_debts WHERE id = ? AND company_id = ?',
            [id, companyId]
        );
        if (debts.length === 0) throw new AppError('Dette introuvable.', 404);
        if (debts[0].status === 'canceled') throw new AppError('Dette annulée.', 400);

        const updateFields = [];
        const updateValues = [];

        if (total_amount !== undefined) {
            const newTotal = parseFloat(total_amount);
            if (isNaN(newTotal) || newTotal <= 0) {
                throw new AppError("Le montant total de la dette doit être supérieur à 0 FCFA.", 400);
            }
            const [paidResult] = await connection.query(
                'SELECT COALESCE(SUM(amount), 0) as total FROM debt_payments WHERE client_debt_id = ?',
                [id]
            );
            const totalPaid = parseFloat(paidResult[0].total);
            const newRemaining = Math.max(0, newTotal - totalPaid);
            const newStatus = debtService.calculateDebtStatus(newTotal, newRemaining);
            updateFields.push('total_amount = ?', 'remaining_amount = ?', 'status = ?');
            updateValues.push(newTotal, newRemaining, newStatus);
        }

        if (due_date !== undefined) { updateFields.push('due_date = ?'); updateValues.push(due_date); }
        if (notes !== undefined) { updateFields.push('notes = ?'); updateValues.push(notes); }
        if (status !== undefined && total_amount === undefined) { updateFields.push('status = ?'); updateValues.push(status); }

        if (updateFields.length > 0) {
            updateValues.push(id);
            await connection.query(`UPDATE client_debts SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);
        }

        await debtService.recalculateClientDebt(connection, debts[0].client_id, companyId);
        await connection.commit();

        const updatedDebt = await debtService.getEnrichedDebtById(connection, id, companyId);

        res.status(200).json({
            success: true,
            message: 'Dette mise à jour.',
            data: { debt: updatedDebt },
        });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

// ─── ANNULER UNE DETTE ──────────────────────────────────
const cancelDebt = async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const companyId = req.company.id;

        const [debts] = await connection.query(
            'SELECT * FROM client_debts WHERE id = ? AND company_id = ?',
            [id, companyId]
        );
        if (debts.length === 0) throw new AppError('Dette introuvable.', 404);
        if (debts[0].status === 'canceled') throw new AppError('Déjà annulée.', 400);

        await connection.query(
            'UPDATE client_debts SET status = "canceled", remaining_amount = 0 WHERE id = ?',
            [id]
        );

        await debtService.recalculateClientDebt(connection, debts[0].client_id, companyId);
        await connection.commit();

        res.status(200).json({
            success: true,
            message: 'Dette annulée.',
        });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

// ─── STATISTIQUES ───────────────────────────────────────
const getDebtStats = async (req, res, next) => {
    try {
        const companyId = req.company.id;

        const [stats] = await pool.query(
            `SELECT
         COUNT(*) as total_debts,
         COALESCE(SUM(remaining_amount), 0) as total_remaining,
         COALESCE(SUM(total_amount - remaining_amount), 0) as total_paid,
         COUNT(CASE WHEN due_date IS NOT NULL AND due_date < CURDATE() AND status NOT IN ('paid', 'canceled') THEN 1 END) as overdue_count,
         COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
         COUNT(CASE WHEN status = 'partial' THEN 1 END) as partial_count,
         COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
       FROM client_debts
       WHERE company_id = ?`,
            [companyId]
        );

        res.status(200).json({ success: true, data: stats[0] });
    } catch (error) {
        next(error);
    }
};

module.exports = { createDebt, getDebts, getDebtById, updateDebt, cancelDebt, getDebtStats };