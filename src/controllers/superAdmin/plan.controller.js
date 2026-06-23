// controllers/superAdmin/plan.controller.js
const pool = require('../../config/db');
const AppError = require('../../utils/AppError');

// ─── LISTE DE TOUS LES PLANS ──────────────────────────
const getAllPlans = async (req, res, next) => {
    try {
        const { include_inactive = 'false' } = req.query;

        let query = `
      SELECT 
        sp.*,
        (SELECT COUNT(*) FROM companies c WHERE c.subscription_plan_id = sp.id AND c.deleted_at IS NULL) as total_companies,
        (SELECT COUNT(*) FROM companies c WHERE c.subscription_plan_id = sp.id AND c.subscription_status = 'active' AND c.deleted_at IS NULL) as active_companies
      FROM subscription_plans sp
    `;

        if (include_inactive !== 'true') {
            query += ' WHERE sp.is_active = 1';
        }

        query += ' ORDER BY sp.price_monthly ASC';

        const [plans] = await pool.query(query);

        // Pour chaque plan, calculer le revenu mensuel estimé
        const plansWithRevenue = plans.map(plan => ({
            ...plan,
            estimated_monthly_revenue: plan.price_monthly * plan.active_companies,
            estimated_yearly_revenue: plan.price_yearly * plan.active_companies,
        }));

        res.status(200).json({
            success: true,
            data: {
                plans: plansWithRevenue,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ─── STATISTIQUES DES PLANS ───────────────────────────
const getPlanStats = async (req, res, next) => {
    try {
        // Total des plans
        const [totalPlans] = await pool.query(
            'SELECT COUNT(*) as total FROM subscription_plans'
        );

        // Plans actifs
        const [activePlans] = await pool.query(
            'SELECT COUNT(*) as total FROM subscription_plans WHERE is_active = 1'
        );

        // Total companies par plan
        const [companiesByPlan] = await pool.query(`
      SELECT 
        sp.name,
        sp.code,
        COUNT(c.id) as total,
        SUM(CASE WHEN c.subscription_status = 'active' THEN 1 ELSE 0 END) as active
      FROM subscription_plans sp
      LEFT JOIN companies c ON c.subscription_plan_id = sp.id AND c.deleted_at IS NULL
      GROUP BY sp.id, sp.name, sp.code
      ORDER BY sp.price_monthly ASC
    `);

        // Revenu total estimé
        const [totalRevenue] = await pool.query(`
      SELECT COALESCE(SUM(sp.price_monthly), 0) as total
      FROM companies c
      JOIN subscription_plans sp ON c.subscription_plan_id = sp.id
      WHERE c.subscription_status = 'active' AND c.deleted_at IS NULL
    `);

        // Plan le plus populaire
        const [mostPopular] = await pool.query(`
      SELECT sp.name, sp.code, COUNT(c.id) as total
      FROM subscription_plans sp
      LEFT JOIN companies c ON c.subscription_plan_id = sp.id AND c.deleted_at IS NULL
      GROUP BY sp.id, sp.name, sp.code
      ORDER BY total DESC
      LIMIT 1
    `);

        res.status(200).json({
            success: true,
            data: {
                total_plans: totalPlans[0].total,
                active_plans: activePlans[0].total,
                companies_by_plan: companiesByPlan,
                total_estimated_revenue: totalRevenue[0].total,
                most_popular_plan: mostPopular.length > 0 ? mostPopular[0] : null,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ─── DÉTAIL D'UN PLAN ─────────────────────────────────
const getPlanDetail = async (req, res, next) => {
    try {
        const { id } = req.params;

        const [plans] = await pool.query(
            'SELECT * FROM subscription_plans WHERE id = ?',
            [id]
        );

        if (plans.length === 0) {
            throw new AppError('Plan introuvable.', 404);
        }

        const plan = plans[0];

        // Nombre de companies sur ce plan
        const [companyCount] = await pool.query(
            'SELECT COUNT(*) as total FROM companies WHERE subscription_plan_id = ? AND deleted_at IS NULL',
            [id]
        );

        // Companies actives sur ce plan
        const [activeCount] = await pool.query(
            "SELECT COUNT(*) as total FROM companies WHERE subscription_plan_id = ? AND subscription_status = 'active' AND deleted_at IS NULL",
            [id]
        );

        // Dernières companies inscrites sur ce plan
        const [recentCompanies] = await pool.query(
            `SELECT id, name, slug, subscription_status, created_at 
       FROM companies 
       WHERE subscription_plan_id = ? AND deleted_at IS NULL 
       ORDER BY created_at DESC 
       LIMIT 10`,
            [id]
        );

        // Factures liées à ce plan
        const [invoices] = await pool.query(
            `SELECT si.*, c.name as company_name
       FROM subscription_invoices si
       JOIN companies c ON si.company_id = c.id
       WHERE si.plan_id = ?
       ORDER BY si.created_at DESC
       LIMIT 10`,
            [id]
        );

        // Historique des changements de plan (depuis audit logs)
        const [planChanges] = await pool.query(
            `SELECT aal.*, u.first_name, u.last_name
       FROM admin_audit_logs aal
       JOIN users u ON aal.admin_id = u.id
       WHERE aal.target_type = 'plan' AND aal.target_id = ?
       ORDER BY aal.created_at DESC
       LIMIT 20`,
            [id]
        );

        res.status(200).json({
            success: true,
            data: {
                plan: {
                    ...plan,
                    features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features,
                },
                stats: {
                    total_companies: companyCount[0].total,
                    active_companies: activeCount[0].total,
                    estimated_monthly_revenue: plan.price_monthly * activeCount[0].total,
                    estimated_yearly_revenue: plan.price_yearly * activeCount[0].total,
                },
                recent_companies: recentCompanies,
                recent_invoices: invoices,
                audit_logs: planChanges,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ─── CRÉER UN PLAN ────────────────────────────────────
const createPlan = async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        const {
            code,
            name,
            price_monthly,
            price_yearly,
            max_employees,
            max_products,
            max_clients,
            features,
            is_active = true,
        } = req.body;

        // Vérifier unicité du code
        const [existing] = await connection.query(
            'SELECT id FROM subscription_plans WHERE code = ?',
            [code]
        );

        if (existing.length > 0) {
            throw new AppError(`Un plan avec le code "${code}" existe déjà.`, 409);
        }

        await connection.beginTransaction();

        const [result] = await connection.query(
            `INSERT INTO subscription_plans (
        code, name, price_monthly, price_yearly, 
        max_employees, max_products, max_clients, 
        features, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                code,
                name,
                price_monthly,
                price_yearly,
                max_employees || null,
                max_products || null,
                max_clients || null,
                features ? JSON.stringify(features) : null,
                is_active,
            ]
        );

        // Audit log
        await connection.query(
            `INSERT INTO admin_audit_logs (admin_id, action_type, target_type, target_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [
                req.user.id,
                'create_plan',
                'plan',
                result.insertId,
                JSON.stringify({ code, name, price_monthly, price_yearly }),
                req.ip,
            ]
        );

        await connection.commit();

        const [newPlan] = await connection.query(
            'SELECT * FROM subscription_plans WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Plan créé avec succès.',
            data: {
                plan: newPlan[0],
            },
        });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

// ─── MODIFIER UN PLAN ──────────────────────────────────
const updatePlan = async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;
        const {
            code,
            name,
            price_monthly,
            price_yearly,
            max_employees,
            max_products,
            max_clients,
            features,
            is_active,
        } = req.body;

        // Vérifier que le plan existe
        const [existing] = await connection.query(
            'SELECT * FROM subscription_plans WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            throw new AppError('Plan introuvable.', 404);
        }

        // Vérifier unicité du code si modifié
        if (code && code !== existing[0].code) {
            const [duplicate] = await connection.query(
                'SELECT id FROM subscription_plans WHERE code = ? AND id != ?',
                [code, id]
            );

            if (duplicate.length > 0) {
                throw new AppError(`Un plan avec le code "${code}" existe déjà.`, 409);
            }
        }

        await connection.beginTransaction();

        // Construire les champs à mettre à jour
        const updates = [];
        const values = [];
        const changes = {};

        if (code !== undefined) { updates.push('code = ?'); values.push(code); changes.code = code; }
        if (name !== undefined) { updates.push('name = ?'); values.push(name); changes.name = name; }
        if (price_monthly !== undefined) { updates.push('price_monthly = ?'); values.push(price_monthly); changes.price_monthly = price_monthly; }
        if (price_yearly !== undefined) { updates.push('price_yearly = ?'); values.push(price_yearly); changes.price_yearly = price_yearly; }
        if (max_employees !== undefined) { updates.push('max_employees = ?'); values.push(max_employees || null); changes.max_employees = max_employees; }
        if (max_products !== undefined) { updates.push('max_products = ?'); values.push(max_products || null); changes.max_products = max_products; }
        if (max_clients !== undefined) { updates.push('max_clients = ?'); values.push(max_clients || null); changes.max_clients = max_clients; }
        if (features !== undefined) { updates.push('features = ?'); values.push(JSON.stringify(features)); changes.features = features; }
        if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active); changes.is_active = is_active; }

        if (updates.length === 0) {
            throw new AppError('Aucune donnée à mettre à jour.', 400);
        }

        updates.push('updated_at = NOW()');
        values.push(id);

        await connection.query(
            `UPDATE subscription_plans SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        // Audit log
        await connection.query(
            `INSERT INTO admin_audit_logs (admin_id, action_type, target_type, target_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [
                req.user.id,
                'update_plan',
                'plan',
                id,
                JSON.stringify({
                    previous: { name: existing[0].name, code: existing[0].code },
                    changes,
                }),
                req.ip,
            ]
        );

        await connection.commit();

        const [updatedPlan] = await connection.query(
            'SELECT * FROM subscription_plans WHERE id = ?',
            [id]
        );

        res.status(200).json({
            success: true,
            message: 'Plan mis à jour avec succès.',
            data: {
                plan: updatedPlan[0],
            },
        });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

// ─── SUPPRIMER UN PLAN ────────────────────────────────
const deletePlan = async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;

        // Vérifier que le plan existe
        const [existing] = await connection.query(
            'SELECT * FROM subscription_plans WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            throw new AppError('Plan introuvable.', 404);
        }

        // Vérifier qu'aucune entreprise n'utilise ce plan
        const [companiesUsing] = await connection.query(
            'SELECT COUNT(*) as total FROM companies WHERE subscription_plan_id = ? AND deleted_at IS NULL',
            [id]
        );

        if (companiesUsing[0].total > 0) {
            throw new AppError(
                `Impossible de supprimer ce plan : ${companiesUsing[0].total} entreprise(s) l'utilisent actuellement. Veuillez d'abord migrer ces entreprises vers un autre plan.`,
                400
            );
        }

        await connection.beginTransaction();

        // Supprimer les factures liées à ce plan
        await connection.query(
            'DELETE FROM subscription_invoices WHERE plan_id = ?',
            [id]
        );

        // Supprimer les preuves de paiement liées
        await connection.query(
            'DELETE FROM subscription_payment_proofs WHERE plan_id = ?',
            [id]
        );

        // Supprimer le plan
        await connection.query(
            'DELETE FROM subscription_plans WHERE id = ?',
            [id]
        );

        // Audit log
        await connection.query(
            `INSERT INTO admin_audit_logs (admin_id, action_type, target_type, target_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [
                req.user.id,
                'delete_plan',
                'plan',
                id,
                JSON.stringify({ name: existing[0].name, code: existing[0].code }),
                req.ip,
            ]
        );

        await connection.commit();

        res.status(200).json({
            success: true,
            message: `Le plan "${existing[0].name}" a été supprimé définitivement.`,
        });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

// ─── ACTIVER / DÉSACTIVER UN PLAN ──────────────────────
const togglePlanStatus = async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;

        const [existing] = await connection.query(
            'SELECT * FROM subscription_plans WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            throw new AppError('Plan introuvable.', 404);
        }

        const plan = existing[0];
        const newStatus = !plan.is_active;

        // Si on désactive, vérifier les entreprises actives
        if (!newStatus) {
            const [activeCompanies] = await connection.query(
                "SELECT COUNT(*) as total FROM companies WHERE subscription_plan_id = ? AND subscription_status = 'active' AND deleted_at IS NULL",
                [id]
            );

            if (activeCompanies[0].total > 0) {
                throw new AppError(
                    `Impossible de désactiver ce plan : ${activeCompanies[0].total} entreprise(s) active(s) l'utilisent. Veuillez d'abord migrer ces entreprises.`,
                    400
                );
            }
        }

        await connection.beginTransaction();

        await connection.query(
            'UPDATE subscription_plans SET is_active = ?, updated_at = NOW() WHERE id = ?',
            [newStatus, id]
        );

        // Audit log
        await connection.query(
            `INSERT INTO admin_audit_logs (admin_id, action_type, target_type, target_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [
                req.user.id,
                newStatus ? 'activate_plan' : 'deactivate_plan',
                'plan',
                id,
                JSON.stringify({ name: plan.name, code: plan.code, previous_status: plan.is_active, new_status: newStatus }),
                req.ip,
            ]
        );

        await connection.commit();

        res.status(200).json({
            success: true,
            message: `Le plan a été ${newStatus ? 'activé' : 'désactivé'}.`,
            data: {
                plan: { ...plan, is_active: newStatus },
            },
        });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

module.exports = {
    getAllPlans,
    getPlanDetail,
    getPlanStats,
    createPlan,
    updatePlan,
    deletePlan,
    togglePlanStatus,
};