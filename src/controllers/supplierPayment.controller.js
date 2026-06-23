// controllers/supplierPayment.controller.js
const pool = require('../config/db');
const AppError = require('../utils/AppError');

// Import des fonctions utilitaires du controller commande
const {
  recalculateOrderTotals,
  updateSupplierBalance,
} = require('./supplierOrder.controller');

// ─── LISTER TOUS LES PAIEMENTS ─────────────────────────
const getAllPayments = async (req, res, next) => {
  try {
    const companyId = req.company.id;
    const {
      page = 1,
      limit = 20,
      supplier_id = '',
      order_id = '',
      payment_method = '',
      search = '',
      date_from = '',
      date_to = '',
      sort_by = 'payment_date',
      sort_order = 'DESC',
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereConditions = ['sp.company_id = ?'];
    let queryParams = [companyId];

    if (supplier_id) {
      whereConditions.push('sp.supplier_id = ?');
      queryParams.push(supplier_id);
    }

    if (order_id === 'global') {
      whereConditions.push('sp.supplier_order_id IS NULL');
    } else if (order_id) {
      whereConditions.push('sp.supplier_order_id = ?');
      queryParams.push(order_id);
    }

    if (payment_method) {
      whereConditions.push('sp.payment_method = ?');
      queryParams.push(payment_method);
    }

    if (search) {
      whereConditions.push(
        '(sp.payment_reference LIKE ? OR sp.note LIKE ? OR s.company_name LIKE ?)'
      );
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (date_from) {
      whereConditions.push('sp.payment_date >= ?');
      queryParams.push(date_from);
    }

    if (date_to) {
      whereConditions.push('sp.payment_date <= ?');
      queryParams.push(date_to);
    }

    const whereClause = 'WHERE ' + whereConditions.join(' AND ');

    // Requête paginée
    const query = `
      SELECT 
        sp.*,
        s.company_name as supplier_name,
        so.order_number,
        u.first_name as paid_by_name,
        u.last_name as paid_by_lastname
      FROM supplier_payments sp
      JOIN suppliers s ON sp.supplier_id = s.id
      LEFT JOIN supplier_orders so ON sp.supplier_order_id = so.id
      LEFT JOIN users u ON sp.paid_by = u.id
      ${whereClause}
      ORDER BY sp.payment_date ${sort_order}, sp.created_at ${sort_order}
      LIMIT ? OFFSET ?
    `;

    queryParams.push(parseInt(limit), offset);
    const [payments] = await pool.query(query, queryParams);

    // Total pour pagination
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM supplier_payments sp 
      JOIN suppliers s ON sp.supplier_id = s.id 
      ${whereClause}
    `;
    const [countResult] = await pool.query(
      countQuery,
      queryParams.slice(0, -2)
    );
    const total = countResult[0].total;

    // Stats globales (indépendantes des filtres de recherche texte)
    const [stats] = await pool.query(
      `SELECT 
        COUNT(*) as total_payments,
        COALESCE(SUM(sp.amount), 0) as total_amount,
        COALESCE(SUM(CASE WHEN sp.supplier_order_id IS NOT NULL THEN sp.amount ELSE 0 END), 0) as linked_amount,
        COALESCE(SUM(CASE WHEN sp.supplier_order_id IS NULL THEN sp.amount ELSE 0 END), 0) as global_amount
       FROM supplier_payments sp
       WHERE sp.company_id = ?`,
      [companyId]
    );

    res.status(200).json({
      success: true,
      data: {
        payments,
        stats: stats[0],
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

// ─── AJOUTER UN PAIEMENT GLOBAL ────────────────────────
const addPayment = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const companyId = req.company.id;
    const {
      supplier_id,
      amount,
      payment_method,
      payment_reference,
      payment_date,
      note,
    } = req.body;

    if (!supplier_id) {
      throw new AppError("L'ID du fournisseur est requis.", 400);
    }

    // Vérifier que le fournisseur existe et est actif
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

    await connection.beginTransaction();

    // Insérer le paiement global (supplier_order_id = NULL)
    await connection.query(
      `INSERT INTO supplier_payments (
        company_id, supplier_id, supplier_order_id, amount,
        payment_method, payment_reference, payment_date, paid_by, note
      ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?)`,
      [
        companyId,
        supplier_id,
        amount,
        payment_method,
        payment_reference || null,
        payment_date,
        req.user.id,
        note || null,
      ]
    );

    // Mettre à jour le solde du fournisseur via la fonction centralisée
    await updateSupplierBalance(connection, supplier_id, companyId);

    await connection.commit();

    // Récupérer le solde mis à jour
    const [updatedSupplier] = await connection.query(
      'SELECT id, company_name, current_balance FROM suppliers WHERE id = ?',
      [supplier_id]
    );

    res.status(201).json({
      success: true,
      message: 'Paiement global enregistré.',
      data: {
        supplier: updatedSupplier[0],
      },
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// ─── MODIFIER UN PAIEMENT ──────────────────────────────
const updatePayment = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { paymentId } = req.params;
    const companyId = req.company.id;
    const {
      amount,
      payment_method,
      payment_reference,
      payment_date,
      note,
    } = req.body;

    // Vérifier que le paiement existe
    const [payments] = await connection.query(
      'SELECT * FROM supplier_payments WHERE id = ? AND company_id = ?',
      [paymentId, companyId]
    );

    if (payments.length === 0) {
      throw new AppError('Paiement introuvable.', 404);
    }

    const payment = payments[0];

    await connection.beginTransaction();

    // Construire les champs à mettre à jour
    const updates = [];
    const values = [];

    if (amount !== undefined) {
      updates.push('amount = ?');
      values.push(amount);
    }
    if (payment_method !== undefined) {
      updates.push('payment_method = ?');
      values.push(payment_method);
    }
    if (payment_reference !== undefined) {
      updates.push('payment_reference = ?');
      values.push(payment_reference || null);
    }
    if (payment_date !== undefined) {
      updates.push('payment_date = ?');
      values.push(payment_date);
    }
    if (note !== undefined) {
      updates.push('note = ?');
      values.push(note || null);
    }

    if (updates.length > 0) {
      values.push(paymentId);
      await connection.query(
        `UPDATE supplier_payments SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    // Recalculer les totaux si le paiement est lié à une commande
    if (payment.supplier_order_id) {
      await recalculateOrderTotals(connection, payment.supplier_order_id);
    }

    // Toujours recalculer le solde fournisseur
    await updateSupplierBalance(connection, payment.supplier_id, companyId);

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
    const { paymentId } = req.params;
    const companyId = req.company.id;

    // Vérifier que le paiement existe
    const [payments] = await connection.query(
      'SELECT * FROM supplier_payments WHERE id = ? AND company_id = ?',
      [paymentId, companyId]
    );

    if (payments.length === 0) {
      throw new AppError('Paiement introuvable.', 404);
    }

    const payment = payments[0];

    await connection.beginTransaction();

    // Supprimer le paiement
    await connection.query('DELETE FROM supplier_payments WHERE id = ?', [
      paymentId,
    ]);

    // Recalculer les totaux de la commande si lié
    if (payment.supplier_order_id) {
      await recalculateOrderTotals(connection, payment.supplier_order_id);
    }

    // Toujours recalculer le solde fournisseur
    await updateSupplierBalance(connection, payment.supplier_id, companyId);

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

module.exports = { getAllPayments, addPayment, updatePayment, deletePayment };