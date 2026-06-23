// controllers/supplierOrder.controller.js
const pool = require('../config/db');
const AppError = require('../utils/AppError');

// ─── GÉNÉRER UN NUMÉRO DE COMMANDE UNIQUE ──────────────
const generateOrderNumber = async (connection, companyId) => {
    const date = new Date();
    const prefix = `BC-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;

    const [lastOrder] = await connection.query(
        "SELECT order_number FROM supplier_orders WHERE company_id = ? AND order_number LIKE ? ORDER BY id DESC LIMIT 1",
        [companyId, `${prefix}%`]
    );

    let sequence = 1;
    if (lastOrder.length > 0) {
        const lastSeq = parseInt(lastOrder[0].order_number.split('-').pop());
        sequence = lastSeq + 1;
    }

    return `${prefix}-${String(sequence).padStart(4, '0')}`;
};

// ─── RECALCULER LES TOTAUX D'UNE COMMANDE ──────────────
const recalculateOrderTotals = async (connection, orderId) => {
    // Recalculer depuis les items
    const [items] = await connection.query(
        'SELECT COALESCE(SUM(quantity_ordered * unit_cost), 0) as subtotal FROM supplier_order_items WHERE supplier_order_id = ?',
        [orderId]
    );

    const subtotal = parseFloat(items[0].subtotal);

    const [order] = await connection.query(
        'SELECT tax_amount, shipping_cost FROM supplier_orders WHERE id = ?',
        [orderId]
    );

    const tax = parseFloat(order[0].tax_amount || 0);
    const shipping = parseFloat(order[0].shipping_cost || 0);
    const total = subtotal + tax + shipping;

    // Récupérer le total payé
    const [payments] = await connection.query(
        'SELECT COALESCE(SUM(amount), 0) as total_paid FROM supplier_payments WHERE supplier_order_id = ?',
        [orderId]
    );

    const totalPaid = parseFloat(payments[0].total_paid);
    const remaining = total - totalPaid;

    await connection.query(
        'UPDATE supplier_orders SET subtotal = ?, total_amount = ?, total_paid = ?, remaining_balance = ? WHERE id = ?',
        [subtotal, total, totalPaid, remaining, orderId]
    );
};

// ─── METTRE À JOUR LE SOLDE DU FOURNISSEUR ─────────────
// controllers/supplierOrder.controller.js (remplacer la fonction)

// ─── METTRE À JOUR LE SOLDE DU FOURNISSEUR ─────────────
const updateSupplierBalance = async (connection, supplierId, companyId) => {
    // 1. Récupérer le solde initial du fournisseur (celui saisi à la création)
    const [supplier] = await connection.query(
        'SELECT id, current_balance FROM suppliers WHERE id = ? AND company_id = ?',
        [supplierId, companyId]
    );

    if (supplier.length === 0) return;

    // 2. Somme des remaining_balance de toutes les commandes non annulées
    //    (ce sont les dettes par commande)
    const [ordersResult] = await connection.query(
        `SELECT 
       COALESCE(SUM(remaining_balance), 0) as total_remaining,
       COALESCE(SUM(total_amount), 0) as total_purchases
     FROM supplier_orders
     WHERE supplier_id = ? AND company_id = ? AND status NOT IN ('canceled')`,
        [supplierId, companyId]
    );

    const totalRemaining = parseFloat(ordersResult[0].total_remaining);
    const totalPurchases = parseFloat(ordersResult[0].total_purchases);

    // 3. Total des paiements GLOBAUX (non liés à une commande)
    const [globalPayments] = await connection.query(
        `SELECT COALESCE(SUM(amount), 0) as total
     FROM supplier_payments
     WHERE supplier_id = ? AND company_id = ? AND supplier_order_id IS NULL`,
        [supplierId, companyId]
    );

    const totalGlobalPayments = parseFloat(globalPayments[0].total);

    // 4. Le solde actuel = total dû sur les commandes - paiements globaux déjà effectués
    //    (Les paiements liés aux commandes sont déjà déduits dans remaining_balance)
    const calculatedBalance = totalRemaining - totalGlobalPayments;

    // 5. Mettre à jour le fournisseur
    await connection.query(
        `UPDATE suppliers 
     SET current_balance = ?, 
         total_purchases = ?
     WHERE id = ?`,
        [Math.max(0, calculatedBalance), totalPurchases, supplierId]
    );
};

// ─── CRÉER UNE COMMANDE ────────────────────────────────
const createOrder = async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        const {
            supplier_id,
            reference,
            expected_at,
            shipping_cost = 0,
            tax_amount = 0,
            notes,
            items,
            initial_payment,
        } = req.body;
        const companyId = req.company.id;

        // Vérifier que le fournisseur existe
        const [suppliers] = await connection.query(
            'SELECT id, company_name, is_active FROM suppliers WHERE id = ? AND company_id = ? AND deleted_at IS NULL',
            [supplier_id, companyId]
        );

        if (suppliers.length === 0) {
            throw new AppError('Fournisseur introuvable.', 404);
        }

        if (!suppliers[0].is_active) {
            throw new AppError('Ce fournisseur est désactivé.', 400);
        }

        // Vérifier que tous les produits existent
        const productIds = [...new Set(items.map(i => i.product_id))];
        const [products] = await connection.query(
            'SELECT id, name FROM products WHERE id IN (?) AND company_id = ? AND deleted_at IS NULL',
            [productIds, companyId]
        );

        if (products.length !== productIds.length) {
            throw new AppError('Un ou plusieurs produits sont introuvables.', 404);
        }

        // Générer le numéro de commande
        const orderNumber = await generateOrderNumber(connection, companyId);

        await connection.beginTransaction();

        // Calculer le subtotal
        const subtotal = items.reduce((sum, item) => sum + (item.quantity_ordered * item.unit_cost), 0);
        const totalAmount = subtotal + parseFloat(shipping_cost) + parseFloat(tax_amount);

        // Insérer la commande
        const [orderResult] = await connection.query(
            `INSERT INTO supplier_orders (
        company_id, supplier_id, order_number, reference, status,
        subtotal, tax_amount, shipping_cost, total_amount,
        ordered_at, expected_at, notes, created_by
      ) VALUES (?, ?, ?, ?, 'ordered', ?, ?, ?, ?, NOW(), ?, ?, ?)`,
            [
                companyId, supplier_id, orderNumber, reference || null,
                subtotal, tax_amount, shipping_cost, totalAmount,
                expected_at || null, notes || null, req.user.id,
            ]
        );

        const orderId = orderResult.insertId;

        // Insérer les items
        for (const item of items) {
            await connection.query(
                `INSERT INTO supplier_order_items (
          supplier_order_id, product_id, variant_id,
          quantity_ordered, unit_cost, total_cost
        ) VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    orderId, item.product_id, item.variant_id || null,
                    item.quantity_ordered, item.unit_cost,
                    item.quantity_ordered * item.unit_cost,
                ]
            );
        }

        // Paiement initial si fourni
        if (initial_payment && initial_payment.amount > 0) {
            await connection.query(
                `INSERT INTO supplier_payments (
          company_id, supplier_id, supplier_order_id, amount,
          payment_method, payment_reference, payment_date, paid_by, note
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    companyId, supplier_id, orderId, initial_payment.amount,
                    initial_payment.payment_method || 'cash',
                    initial_payment.payment_reference || null,
                    initial_payment.payment_date || new Date().toISOString().split('T')[0],
                    req.user.id,
                    initial_payment.note || 'Paiement initial',
                ]
            );
        }

        // Recalculer les totaux
        await recalculateOrderTotals(connection, orderId);

        // Mettre à jour le solde fournisseur
        await updateSupplierBalance(connection, supplier_id, companyId);

        await connection.commit();

        // Récupérer la commande créée
        const [orders] = await connection.query(
            `SELECT so.*, s.company_name as supplier_name
       FROM supplier_orders so
       JOIN suppliers s ON so.supplier_id = s.id
       WHERE so.id = ?`,
            [orderId]
        );

        const [orderItems] = await connection.query(
            `SELECT soi.*, p.name as product_name, p.sku as product_sku
       FROM supplier_order_items soi
       JOIN products p ON soi.product_id = p.id
       WHERE soi.supplier_order_id = ?`,
            [orderId]
        );

        res.status(201).json({
            success: true,
            message: 'Commande créée avec succès.',
            data: {
                order: orders[0],
                items: orderItems,
            },
        });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

// ─── LISTER LES COMMANDES ──────────────────────────────
const getOrders = async (req, res, next) => {
    try {
        const companyId = req.company.id;
        const {
            page = 1,
            limit = 20,
            supplier_id = '',
            status = '',
            search = '',
            sort_by = 'created_at',
            sort_order = 'DESC',
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const allowedSort = ['created_at', 'total_amount', 'remaining_balance', 'expected_at'];
        const sortColumn = allowedSort.includes(sort_by) ? sort_by : 'created_at';
        const order = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        let whereConditions = ['so.company_id = ?'];
        let queryParams = [companyId];

        if (supplier_id) {
            whereConditions.push('so.supplier_id = ?');
            queryParams.push(supplier_id);
        }

        if (status) {
            whereConditions.push('so.status = ?');
            queryParams.push(status);
        }

        if (search) {
            whereConditions.push('(so.order_number LIKE ? OR so.reference LIKE ?)');
            queryParams.push(`%${search}%`, `%${search}%`);
        }

        const whereClause = 'WHERE ' + whereConditions.join(' AND ');

        const query = `
      SELECT so.*,
             s.company_name as supplier_name,
             (SELECT COUNT(*) FROM supplier_order_items WHERE supplier_order_id = so.id) as items_count,
             u.first_name as created_by_name, u.last_name as created_by_lastname
      FROM supplier_orders so
      JOIN suppliers s ON so.supplier_id = s.id
      LEFT JOIN users u ON so.created_by = u.id
      ${whereClause}
      ORDER BY so.${sortColumn} ${order}
      LIMIT ? OFFSET ?
    `;

        queryParams.push(parseInt(limit), offset);

        const [orders] = await pool.query(query, queryParams);

        const countQuery = `SELECT COUNT(*) as total FROM supplier_orders so ${whereClause}`;
        const [countResult] = await pool.query(countQuery, queryParams.slice(0, -2));
        const total = countResult[0].total;

        res.status(200).json({
            success: true,
            data: {
                orders,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    total_pages: Math.ceil(total / parseInt(limit)),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// ─── DÉTAIL D'UNE COMMANDE ─────────────────────────────
const getOrderById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const companyId = req.company.id;

        const [orders] = await pool.query(
            `SELECT so.*, s.company_name as supplier_name, s.phone as supplier_phone,
              u.first_name as created_by_name, u.last_name as created_by_lastname
       FROM supplier_orders so
       JOIN suppliers s ON so.supplier_id = s.id
       LEFT JOIN users u ON so.created_by = u.id
       WHERE so.id = ? AND so.company_id = ?`,
            [id, companyId]
        );

        if (orders.length === 0) {
            throw new AppError('Commande introuvable.', 404);
        }

        const order = orders[0];

        // Items
        const [items] = await pool.query(
            `SELECT soi.*, p.name as product_name, p.sku as product_sku, p.current_stock,
              pv.name as variant_name
       FROM supplier_order_items soi
       JOIN products p ON soi.product_id = p.id
       LEFT JOIN product_variants pv ON soi.variant_id = pv.id
       WHERE soi.supplier_order_id = ?`,
            [id]
        );

        // Paiements
        const [payments] = await pool.query(
            `SELECT sp.*, u.first_name as paid_by_name, u.last_name as paid_by_lastname
       FROM supplier_payments sp
       LEFT JOIN users u ON sp.paid_by = u.id
       WHERE sp.supplier_order_id = ?
       ORDER BY sp.payment_date DESC`,
            [id]
        );

        res.status(200).json({
            success: true,
            data: {
                order,
                items,
                payments,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ─── MODIFIER UNE COMMANDE (brouillon ou commandée) ─────
const updateOrder = async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;
        const companyId = req.company.id;
        const { reference, expected_at, shipping_cost, tax_amount, notes, items } = req.body;

        const [orders] = await connection.query(
            'SELECT * FROM supplier_orders WHERE id = ? AND company_id = ?',
            [id, companyId]
        );

        if (orders.length === 0) {
            throw new AppError('Commande introuvable.', 404);
        }

        const order = orders[0];

        if (!['draft', 'ordered', 'confirmed'].includes(order.status)) {
            throw new AppError(`Impossible de modifier une commande au statut "${order.status}".`, 400);
        }

        await connection.beginTransaction();

        // Mettre à jour les champs de la commande
        const updates = [];
        const values = [];

        if (reference !== undefined) { updates.push('reference = ?'); values.push(reference || null); }
        if (expected_at !== undefined) { updates.push('expected_at = ?'); values.push(expected_at || null); }
        if (shipping_cost !== undefined) { updates.push('shipping_cost = ?'); values.push(parseFloat(shipping_cost)); }
        if (tax_amount !== undefined) { updates.push('tax_amount = ?'); values.push(parseFloat(tax_amount)); }
        if (notes !== undefined) { updates.push('notes = ?'); values.push(notes || null); }

        if (updates.length > 0) {
            values.push(id);
            await connection.query(
                `UPDATE supplier_orders SET ${updates.join(', ')} WHERE id = ?`,
                values
            );
        }

        // Mettre à jour les items si fournis
        if (items && items.length > 0) {
            // Supprimer les items existants (seulement si pas encore reçus)
            const [existingItems] = await connection.query(
                'SELECT id, quantity_received FROM supplier_order_items WHERE supplier_order_id = ?',
                [id]
            );

            for (const existing of existingItems) {
                if (parseFloat(existing.quantity_received) > 0) {
                    throw new AppError(
                        'Impossible de modifier les articles : certains ont déjà été partiellement reçus.',
                        400
                    );
                }
            }

            await connection.query(
                'DELETE FROM supplier_order_items WHERE supplier_order_id = ?',
                [id]
            );

            for (const item of items) {
                await connection.query(
                    `INSERT INTO supplier_order_items (
            supplier_order_id, product_id, variant_id,
            quantity_ordered, unit_cost, total_cost
          ) VALUES (?, ?, ?, ?, ?, ?)`,
                    [id, item.product_id, item.variant_id || null, item.quantity_ordered, item.unit_cost, item.quantity_ordered * item.unit_cost]
                );
            }
        }

        // Recalculer les totaux
        await recalculateOrderTotals(connection, id);
        await updateSupplierBalance(connection, order.supplier_id, companyId);

        await connection.commit();

        const [updatedOrder] = await connection.query(
            `SELECT so.*, s.company_name as supplier_name
       FROM supplier_orders so
       JOIN suppliers s ON so.supplier_id = s.id
       WHERE so.id = ?`,
            [id]
        );

        const [orderItems] = await connection.query(
            `SELECT soi.*, p.name as product_name
       FROM supplier_order_items soi
       JOIN products p ON soi.product_id = p.id
       WHERE soi.supplier_order_id = ?`,
            [id]
        );

        res.status(200).json({
            success: true,
            message: 'Commande mise à jour.',
            data: { order: updatedOrder[0], items: orderItems },
        });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

// ─── ANNULER UNE COMMANDE ──────────────────────────────
const cancelOrder = async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;
        const companyId = req.company.id;
        const { reason } = req.body;

        const [orders] = await connection.query(
            'SELECT * FROM supplier_orders WHERE id = ? AND company_id = ?',
            [id, companyId]
        );

        if (orders.length === 0) {
            throw new AppError('Commande introuvable.', 404);
        }

        const order = orders[0];

        if (order.status === 'received') {
            throw new AppError('Impossible d\'annuler une commande totalement reçue.', 400);
        }

        if (order.status === 'canceled') {
            throw new AppError('Cette commande est déjà annulée.', 400);
        }

        // Si partiellement reçue, vérifier qu'on peut annuler le reste
        if (order.status === 'partially_received') {
            throw new AppError('Impossible d\'annuler une commande partiellement reçue.', 400);
        }

        await connection.beginTransaction();

        // Annuler la commande
        await connection.query(
            "UPDATE supplier_orders SET status = 'canceled', notes = CONCAT(COALESCE(notes, ''), ' | Annulation: ', ?) WHERE id = ?",
            [reason || 'Sans motif', id]
        );

        // Supprimer les paiements liés à cette commande
        const [payments] = await connection.query(
            'SELECT id, amount FROM supplier_payments WHERE supplier_order_id = ?',
            [id]
        );

        // On ne supprime pas les paiements, on les garde en historique
        // Mais on met à jour le remaining_balance à 0
        await connection.query(
            'UPDATE supplier_orders SET remaining_balance = 0, total_paid = 0 WHERE id = ?',
            [id]
        );

        // Mettre à jour le solde fournisseur
        await updateSupplierBalance(connection, order.supplier_id, companyId);

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

// ─── CHANGER LE STATUT D'UNE COMMANDE ──────────────────
const updateOrderStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const companyId = req.company.id;
        const { status } = req.body;

        const validStatuses = ['draft', 'ordered', 'confirmed', 'disputed'];
        const validTransitions = {
            draft: ['ordered', 'canceled'],
            ordered: ['confirmed', 'canceled', 'disputed'],
            confirmed: ['canceled', 'disputed'],
            disputed: ['ordered', 'canceled'],
        };

        if (!validStatuses.includes(status)) {
            throw new AppError('Statut invalide. Statuts autorisés : ' + validStatuses.join(', '), 400);
        }

        const [orders] = await pool.query(
            'SELECT * FROM supplier_orders WHERE id = ? AND company_id = ?',
            [id, companyId]
        );

        if (orders.length === 0) {
            throw new AppError('Commande introuvable.', 404);
        }

        const order = orders[0];

        if (!validTransitions[order.status]?.includes(status)) {
            throw new AppError(
                `Impossible de passer de "${order.status}" à "${status}".`,
                400
            );
        }

        await pool.query(
            'UPDATE supplier_orders SET status = ? WHERE id = ?',
            [status, id]
        );

        res.status(200).json({
            success: true,
            message: `Statut mis à jour : ${status}.`,
        });
    } catch (error) {
        next(error);
    }
};

// ─── RÉCEPTIONNER DES ARTICLES ─────────────────────────
const receiveItems = async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;
        const companyId = req.company.id;
        const { items } = req.body;

        const [orders] = await connection.query(
            'SELECT * FROM supplier_orders WHERE id = ? AND company_id = ?',
            [id, companyId]
        );

        if (orders.length === 0) {
            throw new AppError('Commande introuvable.', 404);
        }

        const order = orders[0];

        if (['draft', 'canceled', 'received'].includes(order.status)) {
            throw new AppError(
                `Impossible de réceptionner une commande au statut "${order.status}".`,
                400
            );
        }

        await connection.beginTransaction();

        let allFullyReceived = true;

        for (const received of items) {
            // Vérifier l'item
            const [orderItems] = await connection.query(
                'SELECT * FROM supplier_order_items WHERE id = ? AND supplier_order_id = ?',
                [received.item_id, id]
            );

            if (orderItems.length === 0) {
                throw new AppError(`Article #${received.item_id} introuvable dans cette commande.`, 404);
            }

            const orderItem = orderItems[0];
            const newQtyReceived = parseFloat(orderItem.quantity_received) + parseFloat(received.quantity_received);

            if (newQtyReceived > parseFloat(orderItem.quantity_ordered)) {
                throw new AppError(
                    `La quantité reçue (${newQtyReceived}) dépasse la quantité commandée (${orderItem.quantity_ordered}) pour l'article.`,
                    400
                );
            }

            // Mettre à jour l'item
            await connection.query(
                'UPDATE supplier_order_items SET quantity_received = ?, received_at = NOW() WHERE id = ?',
                [newQtyReceived, received.item_id]
            );

            // Mettre à jour le stock du produit
            if (orderItem.variant_id) {
                await connection.query(
                    'UPDATE product_variants SET current_stock = current_stock + ? WHERE id = ?',
                    [received.quantity_received, orderItem.variant_id]
                );
            }

            await connection.query(
                'UPDATE products SET current_stock = current_stock + ?, cost_price = ? WHERE id = ?',
                [received.quantity_received, orderItem.unit_cost, orderItem.product_id]
            );

            // Vérifier si cet article est complètement reçu
            const [updatedItem] = await connection.query(
                'SELECT quantity_ordered, quantity_received FROM supplier_order_items WHERE id = ?',
                [received.item_id]
            );

            if (parseFloat(updatedItem[0].quantity_received) < parseFloat(updatedItem[0].quantity_ordered)) {
                allFullyReceived = false;
            }
        }

        // Déterminer le nouveau statut
        let newStatus;
        if (allFullyReceived) {
            // Vérifier TOUS les items
            const [allItems] = await connection.query(
                'SELECT quantity_ordered, quantity_received FROM supplier_order_items WHERE supplier_order_id = ?',
                [id]
            );

            const allDone = allItems.every(
                item => parseFloat(item.quantity_received) >= parseFloat(item.quantity_ordered)
            );

            newStatus = allDone ? 'received' : 'partially_received';
        } else {
            newStatus = 'partially_received';
        }

        await connection.query(
            'UPDATE supplier_orders SET status = ?, received_at = IF(? = "received", NOW(), received_at) WHERE id = ?',
            [newStatus, newStatus, id]
        );

        // Créer un mouvement d'inventaire pour chaque article reçu
        for (const received of items) {
            const [orderItem] = await connection.query(
                'SELECT * FROM supplier_order_items WHERE id = ?',
                [received.item_id]
            );

            const [product] = await connection.query(
                'SELECT current_stock FROM products WHERE id = ?',
                [orderItem[0].product_id]
            );

            await connection.query(
                `INSERT INTO inventory_movements (
          company_id, product_id, variant_id, movement_type,
          quantity, stock_before, stock_after,
          reference_type, reference_id, unit_cost, performed_by
        ) VALUES (?, ?, ?, 'purchase', ?, ?, ?, 'supplier_order', ?, ?, ?)`,
                [
                    companyId,
                    orderItem[0].product_id,
                    orderItem[0].variant_id,
                    received.quantity_received,
                    parseFloat(product[0].current_stock) - parseFloat(received.quantity_received),
                    product[0].current_stock,
                    id,
                    orderItem[0].unit_cost,
                    req.user.id,
                ]
            );
        }

        await connection.commit();

        const [updatedOrder] = await connection.query(
            `SELECT so.*, s.company_name as supplier_name
       FROM supplier_orders so
       JOIN suppliers s ON so.supplier_id = s.id
       WHERE so.id = ?`,
            [id]
        );

        res.status(200).json({
            success: true,
            message: `Réception effectuée. Statut : ${newStatus}.`,
            data: { order: updatedOrder[0] },
        });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

// ─── AJOUTER UN PAIEMENT (lié ou non à une commande) ───
const addPayment = async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params; // Peut être l'ID d'une commande ou 'global'
        const companyId = req.company.id;
        const { amount, payment_method, payment_reference, payment_date, note, supplier_id } = req.body;

        // Deux cas :
        // 1. Paiement lié à une commande : id est l'order_id, supplier_id récupéré de la commande
        // 2. Paiement global : id = 'global', supplier_id doit être fourni dans le body

        let orderId = null;
        let targetSupplierId = null;

        if (id === 'global') {
            // Paiement global non lié à une commande
            if (!supplier_id) {
                throw new AppError("L'ID du fournisseur est requis pour un paiement global.", 400);
            }

            // Vérifier que le fournisseur existe
            const [suppliers] = await connection.query(
                'SELECT id, company_name, is_active FROM suppliers WHERE id = ? AND company_id = ? AND deleted_at IS NULL',
                [supplier_id, companyId]
            );

            if (suppliers.length === 0) {
                throw new AppError('Fournisseur introuvable.', 404);
            }

            if (!suppliers[0].is_active) {
                throw new AppError('Ce fournisseur est désactivé.', 400);
            }

            targetSupplierId = parseInt(supplier_id);
            orderId = null;

            // Vérifier que le montant ne dépasse pas le solde total dû au fournisseur
            const currentBalance = parseFloat(suppliers[0].current_balance);
            if (parseFloat(amount) > currentBalance && currentBalance > 0) {
                throw new AppError(
                    `Le montant (${Number(amount).toLocaleString()} FCFA) dépasse le solde dû au fournisseur (${currentBalance.toLocaleString()} FCFA).`,
                    400
                );
            }
        } else {
            // Paiement lié à une commande spécifique
            const [orders] = await connection.query(
                'SELECT * FROM supplier_orders WHERE id = ? AND company_id = ?',
                [id, companyId]
            );

            if (orders.length === 0) {
                throw new AppError('Commande introuvable.', 404);
            }

            const order = orders[0];

            if (order.status === 'canceled') {
                throw new AppError("Impossible d'ajouter un paiement à une commande annulée.", 400);
            }

            // Vérifier que le montant ne dépasse pas le remaining_balance de cette commande
            const remainingBefore = parseFloat(order.remaining_balance);
            if (parseFloat(amount) > remainingBefore && remainingBefore > 0) {
                throw new AppError(
                    `Le montant (${Number(amount).toLocaleString()} FCFA) dépasse le solde restant de cette commande (${remainingBefore.toLocaleString()} FCFA).`,
                    400
                );
            }

            targetSupplierId = order.supplier_id;
            orderId = parseInt(id);
        }

        await connection.beginTransaction();

        // Insérer le paiement
        await connection.query(
            `INSERT INTO supplier_payments (
        company_id, supplier_id, supplier_order_id, amount,
        payment_method, payment_reference, payment_date, paid_by, note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                companyId,
                targetSupplierId,
                orderId, // NULL si paiement global
                amount,
                payment_method,
                payment_reference || null,
                payment_date,
                req.user.id,
                note || null,
            ]
        );

        // Recalculer les totaux de la commande si lié
        if (orderId) {
            await recalculateOrderTotals(connection, orderId);
        }

        // Mettre à jour le solde du fournisseur dans tous les cas
        await updateSupplierBalance(connection, targetSupplierId, companyId);

        await connection.commit();

        // Récupérer les infos mises à jour
        let responseData = {};

        if (orderId) {
            const [updatedOrder] = await connection.query(
                'SELECT * FROM supplier_orders WHERE id = ?',
                [orderId]
            );
            responseData.order = updatedOrder[0];
        }

        const [supplier] = await connection.query(
            'SELECT id, company_name, current_balance FROM suppliers WHERE id = ?',
            [targetSupplierId]
        );
        responseData.supplier = supplier[0];

        res.status(201).json({
            success: true,
            message: orderId
                ? 'Paiement enregistré sur la commande.'
                : 'Paiement global enregistré.',
            data: responseData,
        });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

// ─── LISTER LES PAIEMENTS D'UNE COMMANDE ───────────────
const getOrderPayments = async (req, res, next) => {
    try {
        const { id } = req.params;
        const companyId = req.company.id;

        const [payments] = await pool.query(
            `SELECT sp.*, u.first_name as paid_by_name, u.last_name as paid_by_lastname
       FROM supplier_payments sp
       LEFT JOIN users u ON sp.paid_by = u.id
       WHERE sp.supplier_order_id = ? AND sp.company_id = ?
       ORDER BY sp.payment_date DESC, sp.created_at DESC`,
            [id, companyId]
        );

        res.status(200).json({
            success: true,
            data: { payments },
        });
    } catch (error) {
        next(error);
    }
};

// ─── MODIFIER UN PAIEMENT ──────────────────────────────
const updatePayment = async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        const { id, paymentId } = req.params;
        const companyId = req.company.id;
        const { amount, payment_method, payment_reference, payment_date, note } = req.body;

        const [payments] = await connection.query(
            'SELECT * FROM supplier_payments WHERE id = ? AND supplier_order_id = ? AND company_id = ?',
            [paymentId, id, companyId]
        );

        if (payments.length === 0) {
            throw new AppError('Paiement introuvable.', 404);
        }

        const [orders] = await connection.query(
            'SELECT * FROM supplier_orders WHERE id = ?',
            [id]
        );

        const order = orders[0];

        if (order.status === 'canceled') {
            throw new AppError('Impossible de modifier un paiement sur une commande annulée.', 400);
        }

        await connection.beginTransaction();

        const updates = [];
        const values = [];

        if (amount !== undefined) { updates.push('amount = ?'); values.push(amount); }
        if (payment_method !== undefined) { updates.push('payment_method = ?'); values.push(payment_method); }
        if (payment_reference !== undefined) { updates.push('payment_reference = ?'); values.push(payment_reference || null); }
        if (payment_date !== undefined) { updates.push('payment_date = ?'); values.push(payment_date); }
        if (note !== undefined) { updates.push('note = ?'); values.push(note || null); }

        if (updates.length > 0) {
            values.push(paymentId);
            await connection.query(
                `UPDATE supplier_payments SET ${updates.join(', ')} WHERE id = ?`,
                values
            );
        }

        await recalculateOrderTotals(connection, id);
        await updateSupplierBalance(connection, order.supplier_id, companyId);

        await connection.commit();

        res.status(200).json({
            success: true,
            message: 'Paiement mis à jour.',
        });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

// ─── SUPPRIMER UN PAIEMENT ─────────────────────────────
const deletePayment = async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        const { id, paymentId } = req.params;
        const companyId = req.company.id;

        const [payments] = await connection.query(
            'SELECT * FROM supplier_payments WHERE id = ? AND supplier_order_id = ? AND company_id = ?',
            [paymentId, id, companyId]
        );

        if (payments.length === 0) {
            throw new AppError('Paiement introuvable.', 404);
        }

        const [orders] = await connection.query(
            'SELECT * FROM supplier_orders WHERE id = ?',
            [id]
        );

        await connection.beginTransaction();

        await connection.query(
            'DELETE FROM supplier_payments WHERE id = ?',
            [paymentId]
        );

        await recalculateOrderTotals(connection, id);
        await updateSupplierBalance(connection, orders[0].supplier_id, companyId);

        await connection.commit();

        res.status(200).json({
            success: true,
            message: 'Paiement supprimé.',
        });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

module.exports = {
    createOrder,
    getOrders,
    getOrderById,
    updateSupplierBalance,
    updateOrder,
    cancelOrder,
    updateOrderStatus,
    receiveItems,
    addPayment,
    getOrderPayments,
    updatePayment,
    deletePayment,
};