// controllers/restaurant/sale.controller.js
const pool = require('../../config/db');
const AppError = require('../../utils/AppError');

// ─── GÉNÉRER UN NUMÉRO DE VENTE UNIQUE ──────────────────
const generateSaleNumber = async (connection, companyId) => {
    const date = new Date();
    const prefix = `RES-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;

    const [rows] = await connection.query(
        `SELECT sale_number FROM sales
     WHERE company_id = ? AND sale_number LIKE ?
     ORDER BY id DESC LIMIT 1`,
        [companyId, `${prefix}%`]
    );

    let sequence = 1;
    if (rows.length > 0) {
        const lastSeq = parseInt(rows[0].sale_number.split('-').pop());
        sequence = lastSeq + 1;
    }

    return `${prefix}-${String(sequence).padStart(5, '0')}`;
};

// ─── CRÉER UNE VENTE ────────────────────────────────────
const createSale = async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const {
            client_id,
            client_name,
            items,
            discount_type,
            discount_value,
            payment_status,
            amount_paid,
            payment_method,
            payment_reference,
            notes,
        } = req.body;

        const companyId = req.company.id;
        const userId = req.user.id;

        if (!items || items.length === 0) {
            throw new AppError('Aucun plat dans la commande.', 400);
        }

        // Validation client
        if (client_id) {
            const [clients] = await connection.query(
                'SELECT id FROM clients WHERE id = ? AND company_id = ? AND deleted_at IS NULL',
                [client_id, companyId]
            );
            if (clients.length === 0) {
                throw new AppError('Client introuvable.', 404);
            }
        }

        let subtotal = 0;
        const saleItemsData = [];

        // Traitement des items
        for (const item of items) {
            const [products] = await connection.query(
                `SELECT id, company_id, cost_price, retail_price, wholesale_price, name
         FROM products 
         WHERE id = ? AND product_type = 'dish' AND deleted_at IS NULL`,
                [item.product_id]
            );

            if (products.length === 0) {
                throw new AppError(`Plat ID ${item.product_id} introuvable.`, 404);
            }

            const product = products[0];

            if (product.company_id !== companyId) {
                throw new AppError(`Le plat "${product.name}" n'appartient pas à ce restaurant.`, 403);
            }

            const quantity = Number(item.quantity);
            let unitPrice = Number(item.unit_price);
            let priceType = 'custom';

            if (unitPrice === Number(product.retail_price)) {
                priceType = 'retail';
            } else if (unitPrice === Number(product.wholesale_price)) {
                priceType = 'wholesale';
            }

            if (item.price_type === 'retail') priceType = 'retail';
            if (item.price_type === 'wholesale') priceType = 'wholesale';
            if (item.price_type === 'custom') priceType = 'custom';

            const discountAmount = Number(item.discount_amount || 0);

            // ── Calcul des modificateurs ──────────────────────────────
            let modifiersTotal = 0;
            const modifierChoices = []; // snapshot pour l'historique

            if (item.modifier_choices && Array.isArray(item.modifier_choices) && item.modifier_choices.length > 0) {
                for (const choice of item.modifier_choices) {
                    // Récupérer l'option en BDD pour valider et obtenir les snapshots
                    const [optRows] = await connection.query(
                        `SELECT mo.id, mo.name AS option_name, mo.extra_price,
                                mg.id AS group_id, mg.name AS group_name
                         FROM modifier_options mo
                         JOIN modifier_groups mg ON mg.id = mo.modifier_group_id
                         WHERE mo.id = ? AND mg.company_id = ? AND mo.is_active = 1`,
                        [choice.modifier_option_id, companyId]
                    );

                    if (optRows.length === 0) continue; // option inconnue ou désactivée — on ignore

                    const opt = optRows[0];
                    modifiersTotal += parseFloat(opt.extra_price) || 0;
                    modifierChoices.push({
                        modifier_group_id: opt.group_id,
                        modifier_option_id: opt.id,
                        group_name:   opt.group_name,
                        option_name:  opt.option_name,
                        extra_price:  parseFloat(opt.extra_price) || 0,
                    });
                }
            }

            const totalPrice = (unitPrice + modifiersTotal) * quantity - discountAmount;

            subtotal += totalPrice;

            saleItemsData.push({
                product,
                quantity,
                unitPrice,
                priceType,
                discountAmount,
                modifiersTotal,
                modifierChoices,
                totalPrice,
                item,
            });
        }

        // Remise globale
        let globalDiscount = 0;
        if (discount_type === 'percentage' && discount_value) {
            globalDiscount = subtotal * (Number(discount_value) / 100);
        } else if (discount_type === 'fixed' && discount_value) {
            globalDiscount = Number(discount_value);
        }

        const totalAmount = Math.round((subtotal - globalDiscount) * 100) / 100;
        const paid = Math.round(Number(amount_paid) * 100) / 100;

        if (!amount_paid || paid < totalAmount) {
            throw new AppError(
                `Le montant payé (${paid.toLocaleString()} FCFA) est insuffisant. Total : ${totalAmount.toLocaleString()} FCFA.`,
                400
            );
        }

        const changeAmount = paid > totalAmount ? Math.round((paid - totalAmount) * 100) / 100 : 0;
        const finalPaymentStatus = 'paid';

        // Numéro de vente
        const saleNumber = await generateSaleNumber(connection, companyId);

        const [saleResult] = await connection.query(
            `INSERT INTO sales (
        company_id, sale_number, client_id, client_name,
        subtotal, discount_amount, discount_type, discount_value,
        tax_amount, total_amount, payment_status, amount_paid, amount_due,
        payment_method, payment_reference, status, seller_id, notes, sale_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 0, ?, ?, 'completed', ?, ?, NOW())`,
            [
                companyId, saleNumber, client_id || null, client_name || null,
                subtotal, globalDiscount, discount_type || null, discount_value || null,
                totalAmount, finalPaymentStatus, paid,
                payment_method, payment_reference || null,
                userId, notes || null,
            ]
        );

        const saleId = saleResult.insertId;

        // Insérer les items
        for (const data of saleItemsData) {
            const { product, quantity, unitPrice, priceType, discountAmount, modifiersTotal, modifierChoices, totalPrice } = data;

            const [itemResult] = await connection.query(
                `INSERT INTO sale_items (
          sale_id, product_id, quantity, price_type, unit_price,
          retail_price_ref, wholesale_price_ref, total_price,
          discount_amount, modifiers_total, cost_price, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    saleId, product.id, quantity, priceType, unitPrice,
                    product.retail_price, product.wholesale_price, totalPrice,
                    discountAmount, modifiersTotal || 0, product.cost_price, data.item.notes || null,
                ]
            );

            const saleItemId = itemResult.insertId;

            // Insérer les choix de modificateurs (snapshot historique)
            if (modifierChoices && modifierChoices.length > 0) {
                for (const choice of modifierChoices) {
                    await connection.query(
                        `INSERT INTO sale_item_modifier_choices
                           (sale_item_id, modifier_group_id, modifier_option_id, group_name, option_name, extra_price)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [
                            saleItemId,
                            choice.modifier_group_id,
                            choice.modifier_option_id,
                            choice.group_name,
                            choice.option_name,
                            choice.extra_price,
                        ]
                    );
                }
            }
        }

        await connection.commit();

        const [sales] = await connection.query(
            `SELECT s.*,
              c.first_name as client_first_name, c.last_name as client_last_name, c.phone as client_phone
       FROM sales s
       LEFT JOIN clients c ON s.client_id = c.id
       WHERE s.id = ?`,
            [saleId]
        );

        const [saleItems] = await connection.query(
            `SELECT si.*, p.name as product_name, p.image_url, p.sku
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       WHERE si.sale_id = ?`,
            [saleId]
        );

        res.status(201).json({
            success: true,
            message: 'Commande créée avec succès.',
            data: {
                sale: { ...sales[0], items: saleItems },
                change: changeAmount,
            },
        });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

// ─── LISTER LES VENTES ──────────────────────────────────
const getSales = async (req, res, next) => {
    try {
        const companyId = req.company.id;
        const {
            page = 1,
            limit = 20,
            start_date,
            end_date,
            client_id,
            status,
            payment_status,
            sort_by = 'created_at',
            sort_order = 'DESC',
            search,
        } = req.query;

        let baseQuery = `
      FROM sales s
      LEFT JOIN clients c ON s.client_id = c.id
      LEFT JOIN users u ON s.seller_id = u.id
      WHERE s.company_id = ?
      AND s.status != 'canceled'
    `;

        const queryParams = [companyId];

        if (start_date) { baseQuery += ' AND DATE(s.sale_date) >= ?'; queryParams.push(start_date); }
        if (end_date) { baseQuery += ' AND DATE(s.sale_date) <= ?'; queryParams.push(end_date); }
        if (client_id) { baseQuery += ' AND s.client_id = ?'; queryParams.push(client_id); }
        if (status) { baseQuery += ' AND s.status = ?'; queryParams.push(status); }
        if (payment_status) { baseQuery += ' AND s.payment_status = ?'; queryParams.push(payment_status); }
        if (search) {
            baseQuery += ' AND (s.sale_number LIKE ? OR s.client_name LIKE ? OR c.full_name LIKE ?)';
            queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
        const [countResult] = await pool.query(countQuery, queryParams);
        const total = countResult?.[0]?.total || 0;

        const allowedSort = ['sale_date', 'total_amount', 'sale_number', 'created_at'];
        const sortColumn = allowedSort.includes(sort_by) ? sort_by : 'created_at';
        const order = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        let query = `
      SELECT s.*, c.first_name as client_first_name, c.last_name as client_last_name,
             c.phone as client_phone, u.first_name as seller_name
      ${baseQuery}
      ORDER BY s.${sortColumn} ${order}
      LIMIT ? OFFSET ?
    `;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const salesParams = [...queryParams, parseInt(limit), offset];
        const [sales] = await pool.query(query, salesParams);

        // Compter les items
        for (const sale of sales) {
            const [itemsCount] = await pool.query(
                'SELECT COUNT(*) as count FROM sale_items WHERE sale_id = ?',
                [sale.id]
            );
            sale.items_count = itemsCount?.[0]?.count || 0;
        }

        res.status(200).json({
            success: true,
            data: {
                sales,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit)),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// ─── DÉTAILS D'UNE VENTE ────────────────────────────────
const getSaleById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const companyId = req.company.id;

        const [sales] = await pool.query(
            `SELECT s.*,
              c.first_name as client_first_name, c.last_name as client_last_name,
              c.phone as client_phone, c.email as client_email, c.address as client_address,
              u.first_name as seller_name
       FROM sales s
       LEFT JOIN clients c ON s.client_id = c.id
       LEFT JOIN users u ON s.seller_id = u.id
       WHERE s.id = ? AND s.company_id = ?`,
            [id, companyId]
        );

        if (sales.length === 0) {
            throw new AppError('Vente introuvable.', 404);
        }

        const [items] = await pool.query(
            `SELECT si.*, p.name as product_name, p.image_url as product_image,
              p.sku as product_sku, p.ingredients_text,
              mu.symbol as unit_symbol, cat.name as category_name
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       LEFT JOIN measurement_units mu ON p.unit_id = mu.id
       LEFT JOIN categories cat ON p.category_id = cat.id
       WHERE si.sale_id = ?`,
            [id]
        );

        // Charger les choix de modificateurs pour chaque item
        for (const item of items) {
            const [choices] = await pool.query(
                `SELECT * FROM sale_item_modifier_choices WHERE sale_item_id = ? ORDER BY modifier_group_id, id`,
                [item.id]
            );
            item.modifier_choices = choices;
        }

        res.status(200).json({
            success: true,
            data: {
                sale: { ...sales[0], items },
            },
        });
    } catch (error) {
        next(error);
    }
};

// ─── MODIFIER UNE VENTE ─────────────────────────────────
const updateSale = async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const companyId = req.company.id;
        const userId = req.user.id;

        const {
            client_id,
            client_name,
            items,
            discount_type,
            discount_value,
            payment_status,
            amount_paid,
            payment_method,
            payment_reference,
            notes,
        } = req.body;

        const [sales] = await connection.query(
            'SELECT * FROM sales WHERE id = ? AND company_id = ?',
            [id, companyId]
        );

        if (sales.length === 0) throw new AppError('Vente introuvable.', 404);

        const sale = sales[0];

        if (sale.status === 'canceled') {
            throw new AppError('Impossible de modifier une vente annulée.', 400);
        }

        if (items && items.length > 0) {
            // Supprimer les anciens items
            await connection.query('DELETE FROM sale_items WHERE sale_id = ?', [id]);

            let subtotal = 0;

            for (const item of items) {
                const [products] = await connection.query(
                    `SELECT id, company_id, cost_price, retail_price, wholesale_price, name
           FROM products
           WHERE id = ? AND product_type = 'dish' AND deleted_at IS NULL`,
                    [item.product_id]
                );

                if (products.length === 0) {
                    throw new AppError(`Plat ID ${item.product_id} introuvable.`, 404);
                }

                const product = products[0];

                if (product.company_id !== companyId) {
                    throw new AppError(`Le plat "${product.name}" n'appartient pas à ce restaurant.`, 403);
                }

                const unit = parseFloat(item.unit_price);
                let priceType = 'custom';
                if (unit === parseFloat(product.retail_price)) priceType = 'retail';
                if (unit === parseFloat(product.wholesale_price)) priceType = 'wholesale';

                const discountAmount = parseFloat(item.discount_amount || 0);
                const totalPrice = unit * item.quantity - discountAmount;
                subtotal += totalPrice;

                await connection.query(
                    `INSERT INTO sale_items (
            sale_id, product_id, quantity, price_type, unit_price,
            retail_price_ref, wholesale_price_ref, total_price,
            discount_amount, cost_price, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        id, item.product_id, item.quantity, priceType, unit,
                        product.retail_price, product.wholesale_price, totalPrice,
                        discountAmount, product.cost_price, item.notes || null,
                    ]
                );
            }

            let discountAmount = 0;
            if (discount_type === 'percentage' && discount_value) {
                discountAmount = subtotal * (parseFloat(discount_value) / 100);
            } else if (discount_type === 'fixed' && discount_value) {
                discountAmount = parseFloat(discount_value);
            }

            const totalAmount = subtotal - discountAmount;
            const finalAmountPaid = payment_status === 'paid' ? totalAmount : parseFloat(amount_paid) || 0;
            const amountDue = totalAmount - finalAmountPaid;

            await connection.query(
                `UPDATE sales SET
          client_id = ?, client_name = ?,
          subtotal = ?, discount_amount = ?,
          discount_type = ?, discount_value = ?,
          total_amount = ?, payment_status = ?,
          amount_paid = ?, amount_due = ?,
          payment_method = ?, payment_reference = ?, notes = ?
         WHERE id = ?`,
                [
                    client_id || null, client_name || null,
                    subtotal, discountAmount,
                    discount_type || sale.discount_type, discount_value || sale.discount_value,
                    totalAmount, payment_status || sale.payment_status,
                    finalAmountPaid, amountDue,
                    payment_method || sale.payment_method, payment_reference || sale.payment_reference,
                    notes || sale.notes, id,
                ]
            );
        } else {
            // Mise à jour sans les items
            const updates = [];
            const values = [];

            if (client_id !== undefined) { updates.push('client_id = ?'); values.push(client_id); }
            if (client_name !== undefined) { updates.push('client_name = ?'); values.push(client_name); }
            if (discount_type !== undefined) { updates.push('discount_type = ?'); values.push(discount_type); }
            if (discount_value !== undefined) { updates.push('discount_value = ?'); values.push(discount_value); }
            if (payment_method !== undefined) { updates.push('payment_method = ?'); values.push(payment_method); }
            if (payment_reference !== undefined) { updates.push('payment_reference = ?'); values.push(payment_reference); }
            if (notes !== undefined) { updates.push('notes = ?'); values.push(notes); }
            if (payment_status !== undefined) {
                updates.push('payment_status = ?'); values.push(payment_status);
                if (payment_status === 'paid') {
                    updates.push('amount_paid = ?', 'amount_due = ?');
                    values.push(sale.total_amount, 0);
                } else if (amount_paid !== undefined) {
                    updates.push('amount_paid = ?', 'amount_due = ?');
                    values.push(amount_paid, sale.total_amount - amount_paid);
                }
            }

            if (updates.length > 0) {
                values.push(id);
                await connection.query(`UPDATE sales SET ${updates.join(', ')} WHERE id = ?`, values);
            }
        }

        await connection.commit();

        const [updatedSales] = await connection.query(
            `SELECT s.*,
              c.first_name as client_first_name, c.last_name as client_last_name,
              u.first_name as seller_name
       FROM sales s
       LEFT JOIN clients c ON s.client_id = c.id
       LEFT JOIN users u ON s.seller_id = u.id
       WHERE s.id = ?`,
            [id]
        );

        const [updatedItems] = await connection.query(
            `SELECT si.*, p.name as product_name
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       WHERE si.sale_id = ?`,
            [id]
        );

        res.status(200).json({
            success: true,
            message: 'Commande mise à jour.',
            data: { sale: { ...updatedSales[0], items: updatedItems } },
        });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

// ─── ANNULER UNE VENTE ──────────────────────────────────
const cancelSale = async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const companyId = req.company.id;
        const { cancel_reason } = req.body;

        const [sales] = await connection.query(
            'SELECT * FROM sales WHERE id = ? AND company_id = ?',
            [id, companyId]
        );

        if (sales.length === 0) throw new AppError('Vente introuvable.', 404);

        const sale = sales[0];

        if (sale.status === 'canceled') {
            throw new AppError('Cette vente est déjà annulée.', 400);
        }

        // Marquer les items comme annulés
        await connection.query(
            'UPDATE sale_items SET item_status = "canceled" WHERE sale_id = ?',
            [id]
        );

        // Annuler la vente
        await connection.query(
            'UPDATE sales SET status = "canceled", cancel_reason = ? WHERE id = ?',
            [cancel_reason || 'Annulation manuelle', id]
        );

        // Mettre à jour la dette du client si existant
        if (sale.client_id && sale.payment_status === 'debt') {
            await connection.query(
                'UPDATE clients SET current_debt = GREATEST(current_debt - ?, 0) WHERE id = ?',
                [sale.amount_due, sale.client_id]
            );
        }

        await connection.commit();

        res.status(200).json({
            success: true,
            message: 'Commande annulée avec succès.',
        });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

// ─── STATISTIQUES RAPIDES ───────────────────────────────
const getSalesStats = async (req, res, next) => {
    try {
        const companyId = req.company.id;

        const [todayStats] = await pool.query(
            `SELECT
         COUNT(*) as total_sales,
         COALESCE(SUM(total_amount), 0) as total_revenue,
         COALESCE(AVG(total_amount), 0) as average_sale
       FROM sales
       WHERE company_id = ? AND DATE(sale_date) = CURDATE() AND status = 'completed'`,
            [companyId]
        );

        const [monthStats] = await pool.query(
            `SELECT
         COUNT(*) as total_sales,
         COALESCE(SUM(total_amount), 0) as total_revenue
       FROM sales
       WHERE company_id = ? AND MONTH(sale_date) = MONTH(CURDATE()) AND YEAR(sale_date) = YEAR(CURDATE()) AND status = 'completed'`,
            [companyId]
        );

        const [debtStats] = await pool.query(
            `SELECT
         COUNT(*) as total_debts,
         COALESCE(SUM(amount_due), 0) as total_due
       FROM sales
       WHERE company_id = ? AND payment_status = 'debt' AND status = 'completed'`,
            [companyId]
        );

        // Top plats
        const [topDishes] = await pool.query(
            `SELECT p.name, p.id, SUM(si.quantity) as total_sold, SUM(si.total_price) as total_revenue
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       JOIN sales s ON si.sale_id = s.id
       WHERE s.company_id = ? AND s.status = 'completed' AND p.product_type = 'dish'
       GROUP BY p.id, p.name
       ORDER BY total_sold DESC
       LIMIT 10`,
            [companyId]
        );

        res.status(200).json({
            success: true,
            data: {
                today: todayStats[0],
                this_month: monthStats[0],
                debts: debtStats[0],
                top_dishes: topDishes,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createSale,
    getSales,
    getSaleById,
    updateSale,
    cancelSale,
    getSalesStats,
};