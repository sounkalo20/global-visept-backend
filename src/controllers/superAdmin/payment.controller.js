// controllers/superAdmin/payment.controller.js
const pool = require('../../config/db');
const AppError = require('../../utils/AppError');

// ─── LISTE DES PAIEMENTS EN ATTENTE ──────────────────
const getPendingPayments = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const [payments] = await pool.query(`
      SELECT 
        spp.*,
        c.name as company_name, c.slug as company_slug,
        sp.name as plan_name, sp.code as plan_code,
        u.first_name as submitted_by_firstname, u.last_name as submitted_by_lastname
      FROM subscription_payment_proofs spp
      JOIN companies c ON spp.company_id = c.id
      JOIN subscription_plans sp ON spp.plan_id = sp.id
      LEFT JOIN users u ON spp.company_id = u.id
      WHERE spp.status = 'pending'
      ORDER BY spp.submitted_at ASC
      LIMIT ? OFFSET ?
    `, [parseInt(limit), offset]);

        const [countResult] = await pool.query(
            "SELECT COUNT(*) as total FROM subscription_payment_proofs WHERE status = 'pending'"
        );

        res.status(200).json({
            success: true,
            data: {
                payments,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult[0].total,
                    total_pages: Math.ceil(countResult[0].total / parseInt(limit)),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// controllers/superAdmin/payment.controller.js (REMPLACER approvePayment et rejectPayment)

// ─── APPROUVER UN PAIEMENT ────────────────────────────
const approvePayment = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;

    const [proofs] = await connection.query(
      'SELECT * FROM subscription_payment_proofs WHERE id = ?',
      [id]
    );

    if (proofs.length === 0) {
      throw new AppError('Preuve de paiement introuvable.', 404);
    }

    const proof = proofs[0];

    if (proof.status !== 'pending') {
      throw new AppError(
        `Cette preuve a déjà été ${proof.status === 'approved' ? 'approuvée' : 'rejetée'}.`,
        400
      );
    }

    // Récupérer le plan pour connaître la durée
    const [plans] = await connection.query(
      'SELECT * FROM subscription_plans WHERE id = ?',
      [proof.plan_id]
    );

    if (plans.length === 0) {
      throw new AppError("Plan d'abonnement introuvable.", 404);
    }

    const plan = plans[0];

    await connection.beginTransaction();

    // 1. Mettre à jour la preuve
    await connection.query(
      `UPDATE subscription_payment_proofs 
       SET status = 'approved', reviewed_by = ?, reviewed_at = NOW() 
       WHERE id = ?`,
      [req.user.id, id]
    );

    // 2. Mettre à jour la facture liée
    if (proof.subscription_invoice_id) {
      await connection.query(
        `UPDATE subscription_invoices 
         SET status = 'paid', paid_at = NOW(), payment_method = ? 
         WHERE id = ?`,
        [proof.payment_method, proof.subscription_invoice_id]
      );
    }

    // 3. Mettre à jour l'entreprise : changer de plan + statut actif + dates
    const subscriptionEndsAt = new Date();
    subscriptionEndsAt.setMonth(subscriptionEndsAt.getMonth() + 1);

    await connection.query(
      `UPDATE companies 
       SET subscription_plan_id = ?,
           subscription_status = 'active',
           subscription_started_at = COALESCE(subscription_started_at, NOW()),
           subscription_ends_at = ?,
           grace_period_ends_at = NULL,
           payment_reminder_count = 0,
           payment_reminder_sent_at = NULL,
           updated_at = NOW()
       WHERE id = ?`,
      [proof.plan_id, subscriptionEndsAt, proof.company_id]
    );

    // 4. Créer une notification pour l'entreprise
    const [company] = await connection.query(
      'SELECT id, name FROM companies WHERE id = ?',
      [proof.company_id]
    );

    await connection.query(
      `INSERT INTO admin_notifications (
        company_id, type, title, message, is_read, sent_email
      ) VALUES (?, 'system_announcement', ?, ?, 0, 0)`,
      [
        proof.company_id,
        'Paiement approuvé ✅',
        `Votre paiement de ${Number(proof.amount).toLocaleString()} FCFA pour le plan ${plan.name} a été approuvé. Votre abonnement est actif jusqu'au ${subscriptionEndsAt.toLocaleDateString('fr-FR')}.`,
      ]
    );

    // 5. Audit log
    await connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action_type, target_type, target_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        'approve_payment',
        'subscription',
        id,
        JSON.stringify({
          company_id: proof.company_id,
          company_name: company[0]?.name,
          plan_id: proof.plan_id,
          plan_name: plan.name,
          amount: proof.amount,
          payment_method: proof.payment_method,
          subscription_ends_at: subscriptionEndsAt,
        }),
        req.ip,
      ]
    );

    await connection.commit();

    res.status(200).json({
      success: true,
      message: 'Paiement approuvé avec succès.',
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// ─── REJETER UN PAIEMENT ──────────────────────────────
const rejectPayment = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      throw new AppError('Un motif de rejet est requis.', 400);
    }

    const [proofs] = await connection.query(
      'SELECT * FROM subscription_payment_proofs WHERE id = ?',
      [id]
    );

    if (proofs.length === 0) {
      throw new AppError('Preuve de paiement introuvable.', 404);
    }

    const proof = proofs[0];

    if (proof.status !== 'pending') {
      throw new AppError(
        `Cette preuve a déjà été ${proof.status === 'approved' ? 'approuvée' : 'rejetée'}.`,
        400
      );
    }

    // Récupérer le plan et l'entreprise
    const [plans] = await connection.query(
      'SELECT * FROM subscription_plans WHERE id = ?',
      [proof.plan_id]
    );

    const [company] = await connection.query(
      'SELECT * FROM companies WHERE id = ?',
      [proof.company_id]
    );

    if (company.length === 0) {
      throw new AppError('Entreprise introuvable.', 404);
    }

    await connection.beginTransaction();

    // 1. Mettre à jour la preuve → rejetée
    await connection.query(
      `UPDATE subscription_payment_proofs 
       SET status = 'rejected', reviewed_by = ?, reviewed_at = NOW(), rejection_reason = ? 
       WHERE id = ?`,
      [req.user.id, reason, id]
    );

    // 2. Mettre à jour la facture liée → failed
    if (proof.subscription_invoice_id) {
      await connection.query(
        `UPDATE subscription_invoices 
         SET status = 'failed' 
         WHERE id = ?`,
        [proof.subscription_invoice_id]
      );
    }

    // 3. Remettre l'entreprise sur son ancien état
    //    Si elle était déjà active sur un autre plan, on la remet comme avant
    //    Sinon on la remet en active sur son plan actuel (gratuit par défaut)
    const previousPlanId = company[0].subscription_plan_id || 1; // 1 = plan gratuit par défaut

    await connection.query(
      `UPDATE companies 
       SET subscription_status = 'active',
           subscription_plan_id = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [previousPlanId, proof.company_id]
    );

    // 4. Créer une notification pour l'entreprise
    await connection.query(
      `INSERT INTO admin_notifications (
        company_id, type, title, message, is_read, sent_email
      ) VALUES (?, 'system_announcement', ?, ?, 0, 0)`,
      [
        proof.company_id,
        'Paiement rejeté ❌',
        `Votre paiement de ${Number(proof.amount).toLocaleString()} FCFA pour le plan ${plans[0]?.name || 'inconnu'} a été rejeté. Motif : ${reason}. Veuillez soumettre une nouvelle preuve de paiement.`,
      ]
    );

    // 5. Audit log
    await connection.query(
      `INSERT INTO admin_audit_logs (admin_id, action_type, target_type, target_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        'reject_payment',
        'subscription',
        id,
        JSON.stringify({
          company_id: proof.company_id,
          company_name: company[0].name,
          plan_id: proof.plan_id,
          amount: proof.amount,
          reason,
        }),
        req.ip,
      ]
    );

    await connection.commit();

    res.status(200).json({
      success: true,
      message: 'Paiement rejeté.',
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// ─── STATISTIQUES DES PAIEMENTS ───────────────────────
const getPaymentStats = async (req, res, next) => {
    try {
        // Par statut
        const [byStatus] = await pool.query(`
      SELECT status, COUNT(*) as total
      FROM subscription_payment_proofs
      GROUP BY status
    `);

        // Par méthode de paiement
        const [byMethod] = await pool.query(`
      SELECT payment_method, COUNT(*) as total, COALESCE(SUM(amount), 0) as total_amount
      FROM subscription_payment_proofs
      WHERE status = 'approved'
      GROUP BY payment_method
    `);

        // Approuvés ce mois
        const [approvedThisMonth] = await pool.query(`
      SELECT COUNT(*) as total, COALESCE(SUM(amount), 0) as total_amount
      FROM subscription_payment_proofs
      WHERE status = 'approved' AND reviewed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

        // En attente
        const [pendingCount] = await pool.query(
            "SELECT COUNT(*) as total FROM subscription_payment_proofs WHERE status = 'pending'"
        );

        res.status(200).json({
            success: true,
            data: {
                by_status: byStatus,
                by_method: byMethod,
                approved_this_month: approvedThisMonth[0],
                pending: pendingCount[0].total,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ─── HISTORIQUE DES PAIEMENTS ─────────────────────────
const getPaymentHistory = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status = '' } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let whereClause = '';
        let queryParams = [];

        if (status) {
            whereClause = 'WHERE spp.status = ?';
            queryParams.push(status);
        }

        const query = `
      SELECT 
        spp.*,
        c.name as company_name,
        sp.name as plan_name,
        u_reviewer.first_name as reviewer_firstname,
        u_reviewer.last_name as reviewer_lastname
      FROM subscription_payment_proofs spp
      JOIN companies c ON spp.company_id = c.id
      JOIN subscription_plans sp ON spp.plan_id = sp.id
      LEFT JOIN users u_reviewer ON spp.reviewed_by = u_reviewer.id
      ${whereClause}
      ORDER BY spp.submitted_at DESC
      LIMIT ? OFFSET ?
    `;
        queryParams.push(parseInt(limit), offset);

        const [payments] = await pool.query(query, queryParams);

        // Total
        const countQuery = `SELECT COUNT(*) as total FROM subscription_payment_proofs spp ${whereClause}`;
        const [countResult] = await pool.query(countQuery, queryParams.slice(0, -2));
        const total = countResult[0].total;

        res.status(200).json({
            success: true,
            data: {
                payments,
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

module.exports = {
    getPendingPayments,
    approvePayment,
    rejectPayment,
    getPaymentHistory,
    getPaymentStats
};