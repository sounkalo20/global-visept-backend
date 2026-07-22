// controllers/superAdmin/owner.controller.js
const pool = require('../../config/db');
const AppError = require('../../utils/AppError');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// ─── LISTER LES PROPRIÉTAIRES ─────────────────────────────────
const getAllOwners = async (req, res, next) => {
    try {
        // We select users who are either owners in memberships OR have no memberships but were created by admin (no easy way to filter this currently, so we'll just list all users who have role 'owner' OR have has_unlimited_access = 1 or we can list users who are not super_admin).
        // For simplicity, let's list users who have at least one 'owner' membership, PLUS users who have no memberships at all (newly created owners without companies).

        const [owners] = await pool.query(`
            SELECT DISTINCT
                u.id, u.first_name, u.last_name, u.email, u.phone, u.is_active, u.has_unlimited_access, u.created_at,
                (SELECT COUNT(*) FROM memberships m2 WHERE m2.user_id = u.id AND m2.role = 'owner') as total_companies
            FROM users u
            LEFT JOIN memberships m ON u.id = m.user_id
            WHERE m.role = 'owner' OR m.id IS NULL
            ORDER BY u.created_at DESC
        `);

        res.status(200).json({
            success: true,
            data: { owners }
        });
    } catch (error) {
        next(error);
    }
};

// ─── CRÉER UN PROPRIÉTAIRE ────────────────────────────────────
const createOwner = async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { first_name, last_name, email, phone, password, has_unlimited_access } = req.body;

        // Check if email exists
        const [existingUsers] = await connection.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            throw new AppError('Un utilisateur avec cet email existe déjà.', 409);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await connection.query(
            `INSERT INTO users (first_name, last_name, email, phone, password_hash, has_unlimited_access, is_active)
             VALUES (?, ?, ?, ?, ?, ?, 1)`,
            [first_name, last_name, email, phone, hashedPassword, has_unlimited_access ? 1 : 0]
        );

        const userId = result.insertId;

        // Audit log
        await connection.query(
            `INSERT INTO admin_audit_logs (admin_id, action_type, target_type, target_id, details, ip_address)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                req.user.id,
                'create_owner',
                'user',
                userId,
                JSON.stringify({ email }),
                req.ip
            ]
        );

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Propriétaire créé avec succès.',
            data: { id: userId, email }
        });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

// ─── ACCORDER L'ACCÈS ILLIMITÉ ────────────────────────────────
const grantUnlimitedAccess = async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params; // User ID

        // 1. Set has_unlimited_access = 1 on user
        await connection.query('UPDATE users SET has_unlimited_access = 1 WHERE id = ?', [id]);

        // 2. Get UNLIMITED plan ID
        const [planRows] = await connection.query("SELECT id FROM subscription_plans WHERE code = 'UNLIMITED'");
        if (planRows.length === 0) {
            throw new AppError('Plan UNLIMITED introuvable.', 500);
        }
        const unlimitedPlanId = planRows[0].id;

        // 3. Update all existing companies owned by this user
        const [updateResult] = await connection.query(`
            UPDATE companies c
            JOIN memberships m ON c.id = m.company_id
            SET c.subscription_plan_id = ?, c.subscription_ends_at = NULL, c.subscription_status = 'active'
            WHERE m.user_id = ? AND m.role = 'owner'
        `, [unlimitedPlanId, id]);

        const impactedCompaniesCount = updateResult.affectedRows;

        // 4. Log
        await connection.query(
            `INSERT INTO admin_audit_logs (admin_id, action_type, target_type, target_id, details, ip_address)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                req.user.id,
                'grant_unlimited_plan',
                'user',
                id,
                JSON.stringify({ impacted_companies: impactedCompaniesCount }),
                req.ip
            ]
        );

        res.status(200).json({
            success: true,
            message: `Accès illimité accordé avec succès. ${impactedCompaniesCount} boutique(s) mise(s) à jour.`
        });
    } catch (error) {
        next(error);
    } finally {
        connection.release();
    }
};

// ─── RÉVOQUER L'ACCÈS ILLIMITÉ ────────────────────────────────
const revokeUnlimitedAccess = async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params; // User ID

        // 1. Set has_unlimited_access = 0 on user
        await connection.query('UPDATE users SET has_unlimited_access = 0 WHERE id = ?', [id]);

        // 2. Get FREE plan ID (or default)
        const [planRows] = await connection.query("SELECT id FROM subscription_plans WHERE price_monthly = 0 AND is_admin_only = 0 ORDER BY id ASC LIMIT 1");
        const defaultPlanId = planRows.length > 0 ? planRows[0].id : 1;

        // 3. Update all existing companies owned by this user back to FREE plan
        const [unlimitedPlanRows] = await connection.query("SELECT id FROM subscription_plans WHERE code = 'UNLIMITED'");
        const unlimitedPlanId = unlimitedPlanRows.length > 0 ? unlimitedPlanRows[0].id : null;

        let impactedCompaniesCount = 0;
        if (unlimitedPlanId) {
            const [updateResult] = await connection.query(`
                UPDATE companies c
                JOIN memberships m ON c.id = m.company_id
                SET c.subscription_plan_id = ?
                WHERE m.user_id = ? AND m.role = 'owner' AND c.subscription_plan_id = ?
            `, [defaultPlanId, id, unlimitedPlanId]);
            impactedCompaniesCount = updateResult.affectedRows;
        }

        // 4. Log
        await connection.query(
            `INSERT INTO admin_audit_logs (admin_id, action_type, target_type, target_id, details, ip_address)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                req.user.id,
                'revoke_unlimited_plan',
                'user',
                id,
                JSON.stringify({ impacted_companies: impactedCompaniesCount }),
                req.ip
            ]
        );

        res.status(200).json({
            success: true,
            message: `Accès illimité révoqué avec succès. ${impactedCompaniesCount} boutique(s) rétrogradée(s).`
        });
    } catch (error) {
        next(error);
    } finally {
        connection.release();
    }
};

module.exports = {
    getAllOwners,
    createOwner,
    grantUnlimitedAccess,
    revokeUnlimitedAccess
};
