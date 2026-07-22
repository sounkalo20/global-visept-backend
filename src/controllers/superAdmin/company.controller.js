// controllers/superAdmin/company.controller.js
const pool = require('../../config/db');
const AppError = require('../../utils/AppError');

// ─── LISTE PAGINÉE AVEC FILTRES ──────────────────────
const getAllCompanies = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 20,
            search = '',
            status = '',        // active, past_due, canceled, expired
            business_type = '', // SHOP, RESTAURANT, etc.
            plan = '',          // FREE, STANDARD, PREMIUM
            sort_by = 'created_at',
            sort_order = 'DESC',
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const allowedSortColumns = ['name', 'created_at', 'subscription_status', 'subscription_ends_at'];
        const sortColumn = allowedSortColumns.includes(sort_by) ? sort_by : 'created_at';
        const order = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        let whereConditions = ['c.deleted_at IS NULL'];
        let queryParams = [];

        if (search) {
            whereConditions.push('(c.name LIKE ? OR c.city LIKE ? OR c.country LIKE ?)');
            queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (status) {
            whereConditions.push('c.subscription_status = ?');
            queryParams.push(status);
        }

        if (business_type) {
            whereConditions.push('bt.code = ?');
            queryParams.push(business_type);
        }

        if (plan) {
            whereConditions.push('sp.code = ?');
            queryParams.push(plan);
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        // Requête principale avec jointures
        const query = `
      SELECT 
        c.id, c.uuid, c.name, c.slug, c.logo_url,
        c.subscription_status, c.subscription_ends_at,
        c.city, c.country, c.is_active,
        c.created_at, c.trial_ends_at,
        bt.code as business_type_code, bt.name as business_type_name,
        sp.code as plan_code, sp.name as plan_name,
        (SELECT COUNT(*) FROM memberships m WHERE m.company_id = c.id AND m.is_active = 1) as total_users,
        (SELECT COUNT(*) FROM products p WHERE p.company_id = c.id AND p.deleted_at IS NULL) as total_products,
        (SELECT COUNT(*) FROM clients cl WHERE cl.company_id = c.id AND cl.deleted_at IS NULL) as total_clients
      FROM companies c
      JOIN business_types bt ON c.business_type_id = bt.id
      JOIN subscription_plans sp ON c.subscription_plan_id = sp.id
      ${whereClause}
      ORDER BY c.${sortColumn} ${order}
      LIMIT ? OFFSET ?
    `;

        queryParams.push(parseInt(limit), offset);

        const [companies] = await pool.query(query, queryParams);

        // Total pour pagination
        const countQuery = `
      SELECT COUNT(*) as total 
      FROM companies c 
      JOIN business_types bt ON c.business_type_id = bt.id 
      JOIN subscription_plans sp ON c.subscription_plan_id = sp.id 
      ${whereClause}
    `;
        const [countResult] = await pool.query(countQuery, queryParams.slice(0, -2));
        const total = countResult[0].total;

        res.status(200).json({
            success: true,
            data: {
                companies,
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

// ─── STATISTIQUES GLOBALES DES COMPANIES ──────────────
const getCompanyStats = async (req, res, next) => {
    try {
        // Par type de business
        const [byBusinessType] = await pool.query(`
      SELECT bt.code, bt.name, COUNT(*) as total
      FROM companies c
      JOIN business_types bt ON c.business_type_id = bt.id
      WHERE c.deleted_at IS NULL
      GROUP BY bt.id, bt.code, bt.name
    `);

        // Par statut d'abonnement
        const [bySubscriptionStatus] = await pool.query(`
      SELECT subscription_status, COUNT(*) as total
      FROM companies
      WHERE deleted_at IS NULL
      GROUP BY subscription_status
    `);

        // Par plan
        const [byPlan] = await pool.query(`
      SELECT sp.code, sp.name, COUNT(*) as total
      FROM companies c
      JOIN subscription_plans sp ON c.subscription_plan_id = sp.id
      WHERE c.deleted_at IS NULL
      GROUP BY sp.id, sp.code, sp.name
    `);

        res.status(200).json({
            success: true,
            data: {
                by_business_type: byBusinessType,
                by_subscription_status: bySubscriptionStatus,
                by_plan: byPlan,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ─── DÉTAIL D'UNE ENTREPRISE ──────────────────────────
const getCompanyDetail = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Infos entreprise
        const [companies] = await pool.query(`
      SELECT 
        c.*,
        bt.code as business_type_code, bt.name as business_type_name,
        sp.code as plan_code, sp.name as plan_name, sp.price_monthly,
        sp.price_yearly, sp.features
      FROM companies c
      JOIN business_types bt ON c.business_type_id = bt.id
      JOIN subscription_plans sp ON c.subscription_plan_id = sp.id
      WHERE c.id = ? AND c.deleted_at IS NULL
    `, [id]);

        if (companies.length === 0) {
            throw new AppError('Entreprise introuvable.', 404);
        }

        const company = companies[0];

        // Utilisateurs membres
        const [members] = await pool.query(`
      SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.is_active,
             m.role, m.is_active as membership_active, m.joined_at
      FROM memberships m
      JOIN users u ON m.user_id = u.id
      WHERE m.company_id = ?
      ORDER BY m.role, u.first_name
    `, [id]);

        // Nombre de produits
        const [productCount] = await pool.query(
            'SELECT COUNT(*) as total FROM products WHERE company_id = ? AND deleted_at IS NULL',
            [id]
        );

        // Nombre de clients
        const [clientCount] = await pool.query(
            'SELECT COUNT(*) as total FROM clients WHERE company_id = ? AND deleted_at IS NULL',
            [id]
        );

        // Nombre de fournisseurs
        const [supplierCount] = await pool.query(
            'SELECT COUNT(*) as total FROM suppliers WHERE company_id = ? AND deleted_at IS NULL',
            [id]
        );

        // Nombre de ventes
        const [saleCount] = await pool.query(
            'SELECT COUNT(*) as total FROM sales WHERE company_id = ?',
            [id]
        );

        // Chiffre d'affaires total
        const [totalRevenue] = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) as total 
      FROM sales 
      WHERE company_id = ? AND status = 'completed'
    `, [id]);

        // Abonnement : factures
        const [invoices] = await pool.query(`
      SELECT si.*, sp.name as plan_name
      FROM subscription_invoices si
      JOIN subscription_plans sp ON si.plan_id = sp.id
      WHERE si.company_id = ?
      ORDER BY si.created_at DESC
      LIMIT 10
    `, [id]);

        // Preuves de paiement
        const [paymentProofs] = await pool.query(`
      SELECT spp.*, sp.name as plan_name
      FROM subscription_payment_proofs spp
      JOIN subscription_plans sp ON spp.plan_id = sp.id
      WHERE spp.company_id = ?
      ORDER BY spp.created_at DESC
      LIMIT 10
    `, [id]);

        // Dernières ventes (activité récente)
        const [recentSales] = await pool.query(`
      SELECT id, sale_number, total_amount, payment_status, status, sale_date
      FROM sales
      WHERE company_id = ?
      ORDER BY sale_date DESC
      LIMIT 10
    `, [id]);

        res.status(200).json({
            success: true,
            data: {
                company,
                stats: {
                    total_products: productCount[0].total,
                    total_clients: clientCount[0].total,
                    total_suppliers: supplierCount[0].total,
                    total_sales: saleCount[0].total,
                    total_revenue: totalRevenue[0].total,
                },
                members,
                invoices,
                payment_proofs: paymentProofs,
                recent_sales: recentSales,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ─── SUSPENDRE UNE ENTREPRISE ─────────────────────────
const suspendCompany = async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;
        const { reason } = req.body; // Raison optionnelle

        // Vérifier que l'entreprise existe
        const [companies] = await connection.query(
            'SELECT id, name, is_active FROM companies WHERE id = ? AND deleted_at IS NULL',
            [id]
        );

        if (companies.length === 0) {
            throw new AppError('Entreprise introuvable.', 404);
        }

        if (!companies[0].is_active) {
            throw new AppError('Cette entreprise est déjà suspendue.', 400);
        }

        await connection.beginTransaction();

        // Désactiver l'entreprise
        await connection.query(
            'UPDATE companies SET is_active = 0, updated_at = NOW() WHERE id = ?',
            [id]
        );

        // Désactiver toutes les memberships de cette entreprise
        await connection.query(
            'UPDATE memberships SET is_active = 0, updated_at = NOW() WHERE company_id = ?',
            [id]
        );

        // Enregistrer dans l'audit log
        await connection.query(
            `INSERT INTO admin_audit_logs (admin_id, action_type, target_type, target_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [
                req.user.id,
                'suspend_company',
                'company',
                id,
                JSON.stringify({
                    company_name: companies[0].name,
                    reason: reason || 'Non spécifiée',
                }),
                req.ip,
            ]
        );

        await connection.commit();

        res.status(200).json({
            success: true,
            message: `L'entreprise "${companies[0].name}" a été suspendue.`,
        });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

// ─── RÉACTIVER UNE ENTREPRISE ─────────────────────────
const reactivateCompany = async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;

        const [companies] = await connection.query(
            'SELECT id, name, is_active FROM companies WHERE id = ? AND deleted_at IS NULL',
            [id]
        );

        if (companies.length === 0) {
            throw new AppError('Entreprise introuvable.', 404);
        }

        if (companies[0].is_active) {
            throw new AppError('Cette entreprise est déjà active.', 400);
        }

        await connection.beginTransaction();

        // Réactiver l'entreprise
        await connection.query(
            'UPDATE companies SET is_active = 1, updated_at = NOW() WHERE id = ?',
            [id]
        );

        // Réactiver les memberships qui étaient actives avant
        await connection.query(
            'UPDATE memberships SET is_active = 1, updated_at = NOW() WHERE company_id = ? AND joined_at IS NOT NULL',
            [id]
        );

        await connection.query(
            `INSERT INTO admin_audit_logs (admin_id, action_type, target_type, target_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [
                req.user.id,
                'reactivate_company',
                'company',
                id,
                JSON.stringify({ company_name: companies[0].name }),
                req.ip,
            ]
        );

        await connection.commit();

        res.status(200).json({
            success: true,
            message: `L'entreprise "${companies[0].name}" a été réactivée.`,
        });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

// ─── CRÉER UNE BOUTIQUE GLOBALE ────────────────────────
const createCompanyAdmin = async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { name, description, country, city, address, phone, business_type_id, subscription_plan_id, owner_id } = req.body;
        
        // 1. Generate slug & uuid
        const slugBase = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        const slug = `${slugBase}-${Date.now()}`;
        const { v4: uuidv4 } = require('uuid');
        const uuid = uuidv4();

        // 2. Insert company
        const [companyResult] = await connection.query(
            `INSERT INTO companies (uuid, name, slug, description, business_type_id, 
             subscription_plan_id, subscription_status, subscription_ends_at, country, city, address, phone, is_active)
             VALUES (?, ?, ?, ?, ?, ?, 'active', NULL, ?, ?, ?, ?, 1)`,
            [
                uuid,
                name,
                slug,
                description || null,
                business_type_id || 1,
                subscription_plan_id,
                country || null,
                city || null,
                address || null,
                phone || null,
            ]
        );
        const companyId = companyResult.insertId;

        // 3. Add owner membership
        await connection.query(
            `INSERT INTO memberships (user_id, company_id, role, is_active, joined_at)
             VALUES (?, ?, 'owner', 1, NOW())`,
            [owner_id, companyId]
        );

        // 4. Audit Log
        await connection.query(
            `INSERT INTO admin_audit_logs (admin_id, action_type, target_type, target_id, details, ip_address)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                req.user.id,
                'create_company_admin',
                'company',
                companyId,
                JSON.stringify({ name, owner_id, plan_id: subscription_plan_id }),
                req.ip,
            ]
        );

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Boutique créée et assignée avec succès.',
            data: { id: companyId }
        });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

module.exports = {
    getAllCompanies,
    getCompanyDetail,
    getCompanyStats,
    suspendCompany,
    reactivateCompany,
    createCompanyAdmin
};