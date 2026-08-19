// src/controllers/supplierCredit.controller.js
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const notificationService = require('../services/notification.service');

/**
 * Générer un numéro d'avoir unique : AVO-YYYYMM-XXXX
 */
const generateCreditNumber = async (connection, companyId) => {
  const date = new Date();
  const prefix = `AVO-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;

  const [rows] = await connection.query(
    `SELECT reference FROM supplier_credits 
     WHERE company_id = ? AND reference LIKE ? 
     ORDER BY id DESC LIMIT 1`,
    [companyId, `${prefix}%`]
  );

  let sequence = 1;
  if (rows.length > 0) {
    const lastNum = rows[0].reference;
    const lastSeq = parseInt(lastNum.split('-').pop());
    if (!isNaN(lastSeq)) {
      sequence = lastSeq + 1;
    }
  }

  return `${prefix}-${String(sequence).padStart(4, '0')}`;
};

/**
 * Mettre à jour le solde global du fournisseur
 */
const refreshSupplierBalance = async (connection, supplierId, companyId) => {
  // Somme des remaining_balance des commandes non annulées
  const [ordersRes] = await connection.query(
    `SELECT COALESCE(SUM(remaining_balance), 0) as total_remaining
     FROM supplier_orders
     WHERE supplier_id = ? AND company_id = ? AND status NOT IN ('canceled')`,
    [supplierId, companyId]
  );
  const totalRemaining = parseFloat(ordersRes[0]?.total_remaining || 0);

  // Total des paiements globaux
  const [globalPaymentsRes] = await connection.query(
    `SELECT COALESCE(SUM(amount), 0) as total_global_payments
     FROM supplier_payments
     WHERE supplier_id = ? AND company_id = ? AND supplier_order_id IS NULL`,
    [supplierId, companyId]
  );
  const totalGlobalPayments = parseFloat(globalPaymentsRes[0]?.total_global_payments || 0);

  // Total des avoirs restants disponibles
  const [creditsRes] = await connection.query(
    `SELECT COALESCE(SUM(remaining_amount), 0) as total_available_credits
     FROM supplier_credits
     WHERE supplier_id = ? AND company_id = ? AND status IN ('available', 'partially_used')`,
    [supplierId, companyId]
  );
  const totalAvailableCredits = parseFloat(creditsRes[0]?.total_available_credits || 0);

  const calculatedBalance = totalRemaining - totalGlobalPayments - totalAvailableCredits;

  await connection.query(
    `UPDATE suppliers SET current_balance = ?, updated_at = NOW() WHERE id = ? AND company_id = ?`,
    [calculatedBalance, supplierId, companyId]
  );
};

/**
 * POST /api/supplier-credits
 * Créer un avoir fournisseur
 */
const createSupplierCredit = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const companyId = req.company.id;
    const userId = req.user.id;
    const { supplier_id, amount, reason, origin_order_id, notes } = req.body;

    if (!supplier_id) throw new AppError('Le fournisseur est requis.', 400);
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new AppError('Le montant de l\'avoir doit être supérieur à 0.', 400);
    }

    // Vérifier l'existence du fournisseur
    const [suppliers] = await connection.query(
      'SELECT id, company_name FROM suppliers WHERE id = ? AND company_id = ? AND deleted_at IS NULL',
      [supplier_id, companyId]
    );
    if (suppliers.length === 0) {
      throw new AppError('Fournisseur introuvable.', 404);
    }
    const supplier = suppliers[0];

    // Vérifier la commande d'origine si fournie
    if (origin_order_id) {
      const [orders] = await connection.query(
        'SELECT id, order_number FROM supplier_orders WHERE id = ? AND company_id = ?',
        [origin_order_id, companyId]
      );
      if (orders.length === 0) {
        throw new AppError('Commande source introuvable.', 404);
      }
    }

    const reference = await generateCreditNumber(connection, companyId);

    const [insertRes] = await connection.query(
      `INSERT INTO supplier_credits 
        (company_id, supplier_id, reference, amount, remaining_amount, reason, status, origin_order_id, created_by, notes)
       VALUES (?, ?, ?, ?, ?, ?, 'available', ?, ?, ?)`,
      [companyId, supplier_id, reference, parsedAmount, parsedAmount, reason || null, origin_order_id || null, userId, notes || null]
    );

    // Mettre à jour le solde du fournisseur
    await refreshSupplierBalance(connection, supplier_id, companyId);

    await connection.commit();

    // Notification système
    await notificationService.createNotification({
      company_id: companyId,
      type: 'supplier_credit_created',
      title: `Nouvel avoir fournisseur ${reference}`,
      message: `Avoir de ${parsedAmount.toLocaleString('fr-FR')} FCFA enregistré pour ${supplier.company_name}.`,
      severity: 'info',
      reference_type: 'supplier_credit',
      reference_id: insertRes.insertId,
      action_url: `/shop/supplier-credits`,
    });

    res.status(201).json({
      success: true,
      message: 'Avoir fournisseur créé avec succès.',
      data: {
        id: insertRes.insertId,
        reference,
        supplier_id,
        supplier_name: supplier.company_name,
        amount: parsedAmount,
        remaining_amount: parsedAmount,
        status: 'available',
      },
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * GET /api/supplier-credits
 * Lister les avoirs fournisseurs avec filtres et pagination
 */
const getSupplierCredits = async (req, res, next) => {
  try {
    const companyId = req.company.id;
    const { supplier_id, status, search, page = 1, limit = 20 } = req.query;

    let query = `
      SELECT 
        sc.*,
        s.company_name AS supplier_name,
        s.phone AS supplier_phone,
        so.order_number AS origin_order_number,
        CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) AS created_by_name,
        (
          SELECT COUNT(*) 
          FROM supplier_credit_applications sca 
          WHERE sca.supplier_credit_id = sc.id
        ) AS applications_count
      FROM supplier_credits sc
      JOIN suppliers s ON sc.supplier_id = s.id
      LEFT JOIN supplier_orders so ON sc.origin_order_id = so.id
      LEFT JOIN users u ON sc.created_by = u.id
      WHERE sc.company_id = ?
    `;
    const params = [companyId];

    if (supplier_id) {
      query += ` AND sc.supplier_id = ?`;
      params.push(supplier_id);
    }

    if (status && status !== 'all') {
      query += ` AND sc.status = ?`;
      params.push(status);
    }

    if (search) {
      query += ` AND (sc.reference LIKE ? OR sc.reason LIKE ? OR s.company_name LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    // Totaux pour la synthèse
    const [summaryRows] = await pool.query(
      `SELECT 
        COUNT(*) as total_credits,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(SUM(remaining_amount), 0) as total_remaining_available,
        COALESCE(SUM(amount - remaining_amount), 0) as total_used,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_count,
        SUM(CASE WHEN status = 'partially_used' THEN 1 ELSE 0 END) as partially_used_count,
        SUM(CASE WHEN status = 'used' THEN 1 ELSE 0 END) as used_count
       FROM supplier_credits
       WHERE company_id = ?`,
      [companyId]
    );

    // Pagination
    query += ` ORDER BY sc.created_at DESC LIMIT ? OFFSET ?`;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    const [credits] = await pool.query(query, params);

    res.status(200).json({
      success: true,
      data: {
        summary: summaryRows[0] || {},
        credits,
        pagination: {
          total: summaryRows[0]?.total_credits || 0,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil((summaryRows[0]?.total_credits || 0) / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/supplier-credits/:id
 * Détails d'un avoir et historique de ses applications
 */
const getSupplierCreditById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.company.id;

    const [credits] = await pool.query(
      `SELECT 
        sc.*,
        s.company_name AS supplier_name,
        s.phone AS supplier_phone,
        s.email AS supplier_email,
        so.order_number AS origin_order_number,
        CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) AS created_by_name
       FROM supplier_credits sc
       JOIN suppliers s ON sc.supplier_id = s.id
       LEFT JOIN supplier_orders so ON sc.origin_order_id = so.id
       LEFT JOIN users u ON sc.created_by = u.id
       WHERE sc.id = ? AND sc.company_id = ?`,
      [id, companyId]
    );

    if (credits.length === 0) {
      throw new AppError('Avoir fournisseur introuvable.', 404);
    }

    // Historique des applications
    const [applications] = await pool.query(
      `SELECT 
        sca.*,
        so.order_number,
        so.total_amount AS order_total,
        so.remaining_balance AS order_remaining_balance,
        so.status AS order_status,
        CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) AS applied_by_name
       FROM supplier_credit_applications sca
       JOIN supplier_orders so ON sca.supplier_order_id = so.id
       LEFT JOIN users u ON sca.applied_by = u.id
       WHERE sca.supplier_credit_id = ?
       ORDER BY sca.applied_at DESC`,
      [id]
    );

    res.status(200).json({
      success: true,
      data: {
        credit: credits[0],
        applications,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/supplier-credits/:id/apply
 * Appliquer un avoir (totalement ou partiellement) sur une commande fournisseur
 */
const applySupplierCredit = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const companyId = req.company.id;
    const userId = req.user.id;
    const { supplier_order_id, amount_applied, notes } = req.body;

    if (!supplier_order_id) throw new AppError('La commande fournisseur cible est requise.', 400);
    const parsedAmount = parseFloat(amount_applied);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new AppError('Le montant appliqué doit être supérieur à 0.', 400);
    }

    // 1. Verrouiller et vérifier l'avoir
    const [credits] = await connection.query(
      `SELECT * FROM supplier_credits WHERE id = ? AND company_id = ? FOR UPDATE`,
      [id, companyId]
    );

    if (credits.length === 0) {
      throw new AppError('Avoir fournisseur introuvable.', 404);
    }

    const credit = credits[0];

    if (credit.status === 'used' || credit.status === 'canceled') {
      throw new AppError(`Cet avoir ne peut plus être appliqué (statut: ${credit.status}).`, 400);
    }

    const availableCredit = parseFloat(credit.remaining_amount);
    if (parsedAmount > availableCredit) {
      throw new AppError(
        `Montant trop élevé. Le solde disponible sur cet avoir est de ${availableCredit.toLocaleString('fr-FR')} FCFA.`,
        400
      );
    }

    // 2. Verrouiller et vérifier la commande fournisseur
    const [orders] = await connection.query(
      `SELECT * FROM supplier_orders WHERE id = ? AND company_id = ? FOR UPDATE`,
      [supplier_order_id, companyId]
    );

    if (orders.length === 0) {
      throw new AppError('Commande fournisseur introuvable.', 404);
    }

    const order = orders[0];

    if (order.supplier_id !== credit.supplier_id) {
      throw new AppError('L\'avoir et la commande doivent appartenir au même fournisseur.', 400);
    }

    if (order.status === 'canceled') {
      throw new AppError('Impossible d\'appliquer un avoir sur une commande annulée.', 400);
    }

    const orderRemaining = parseFloat(order.remaining_balance);
    if (parsedAmount > orderRemaining) {
      throw new AppError(
        `Le montant appliqué (${parsedAmount.toLocaleString('fr-FR')} FCFA) dépasse le solde restant dû sur la commande (${orderRemaining.toLocaleString('fr-FR')} FCFA).`,
        400
      );
    }

    // 3. Enregistrer l'application
    await connection.query(
      `INSERT INTO supplier_credit_applications 
        (company_id, supplier_credit_id, supplier_order_id, amount_applied, applied_by, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [companyId, id, supplier_order_id, parsedAmount, userId, notes || null]
    );

    // 4. Mettre à jour l'avoir (remaining_amount & status)
    const newCreditRemaining = availableCredit - parsedAmount;
    const newCreditStatus = newCreditRemaining === 0 ? 'used' : 'partially_used';

    await connection.query(
      `UPDATE supplier_credits 
       SET remaining_amount = ?, status = ?, updated_at = NOW() 
       WHERE id = ?`,
      [newCreditRemaining, newCreditStatus, id]
    );

    // 5. Mettre à jour la commande (remaining_balance & total_paid reste intact pour traçabilité)
    // Note: total_amount d'origine n'est pas modifié rétroactivement!
    const newOrderRemaining = orderRemaining - parsedAmount;
    await connection.query(
      `UPDATE supplier_orders 
       SET remaining_balance = ?, updated_at = NOW() 
       WHERE id = ?`,
      [newOrderRemaining, supplier_order_id]
    );

    // 6. Rafraîchir le solde du fournisseur
    await refreshSupplierBalance(connection, credit.supplier_id, companyId);

    await connection.commit();

    // 7. Notification en temps réel
    await notificationService.createNotification({
      company_id: companyId,
      type: 'supplier_credit_applied',
      title: `Avoir ${credit.reference} appliqué`,
      message: `Avoir de ${parsedAmount.toLocaleString('fr-FR')} FCFA déduit de la commande ${order.order_number}.`,
      severity: 'info',
      reference_type: 'supplier_order',
      reference_id: supplier_order_id,
      action_url: `/shop/supplier-orders`,
    });

    res.status(200).json({
      success: true,
      message: 'Avoir appliqué avec succès sur la commande.',
      data: {
        credit_id: credit.id,
        credit_reference: credit.reference,
        amount_applied: parsedAmount,
        credit_remaining_balance: newCreditRemaining,
        order_remaining_balance: newOrderRemaining,
        credit_status: newCreditStatus,
      },
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * PUT /api/supplier-credits/:id/cancel
 * Annuler un avoir (uniquement si aucun montant n'a encore été utilisé)
 */
const cancelSupplierCredit = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const companyId = req.company.id;

    const [credits] = await connection.query(
      `SELECT * FROM supplier_credits WHERE id = ? AND company_id = ? FOR UPDATE`,
      [id, companyId]
    );

    if (credits.length === 0) {
      throw new AppError('Avoir fournisseur introuvable.', 404);
    }

    const credit = credits[0];

    if (credit.status !== 'available' || parseFloat(credit.remaining_amount) !== parseFloat(credit.amount)) {
      throw new AppError('Impossible d\'annuler un avoir déjà partiellement ou totalement utilisé.', 400);
    }

    await connection.query(
      `UPDATE supplier_credits SET status = 'canceled', remaining_amount = 0, updated_at = NOW() WHERE id = ?`,
      [id]
    );

    await refreshSupplierBalance(connection, credit.supplier_id, companyId);

    await connection.commit();

    res.status(200).json({
      success: true,
      message: 'Avoir fournisseur annulé.',
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

module.exports = {
  createSupplierCredit,
  getSupplierCredits,
  getSupplierCreditById,
  applySupplierCredit,
  cancelSupplierCredit,
};
