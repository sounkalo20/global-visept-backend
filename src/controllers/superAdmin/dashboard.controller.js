// controllers/superAdmin/dashboard.controller.js (REMPLACER)
const pool = require('../../config/db');
const AppError = require('../../utils/AppError');

const getPlatformStats = async (req, res, next) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const firstDayOfMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;
        const firstDayOfYear = `${new Date().getFullYear()}-01-01`;

        // ─── COMPANIES ────────────────────────────────────
        const [totalCompanies] = await pool.query(
            'SELECT COUNT(*) as total FROM companies WHERE deleted_at IS NULL'
        );

        const [activeCompanies] = await pool.query(
            'SELECT COUNT(*) as total FROM companies WHERE is_active = 1 AND deleted_at IS NULL'
        );

        const [newCompaniesThisMonth] = await pool.query(
            'SELECT COUNT(*) as total FROM companies WHERE created_at >= ? AND deleted_at IS NULL',
            [firstDayOfMonth]
        );

        const [newCompaniesToday] = await pool.query(
            'SELECT COUNT(*) as total FROM companies WHERE DATE(created_at) = ? AND deleted_at IS NULL',
            [today]
        );

        // ─── ABONNEMENTS ──────────────────────────────────
        const [activeSubscriptions] = await pool.query(
            "SELECT COUNT(*) as total FROM companies WHERE subscription_status = 'active' AND deleted_at IS NULL"
        );

        const [expiredSubscriptions] = await pool.query(
            "SELECT COUNT(*) as total FROM companies WHERE subscription_status IN ('past_due', 'expired') AND deleted_at IS NULL"
        );

        const [trialCompanies] = await pool.query(
            'SELECT COUNT(*) as total FROM companies WHERE trial_ends_at IS NOT NULL AND trial_ends_at > NOW() AND deleted_at IS NULL'
        );

        // ─── REVENU ───────────────────────────────────────
        const [monthlyRevenue] = await pool.query(
            `SELECT COALESCE(SUM(sp.price_monthly), 0) as total 
       FROM companies c 
       JOIN subscription_plans sp ON c.subscription_plan_id = sp.id 
       WHERE c.subscription_status = 'active' AND c.deleted_at IS NULL`
        );

        const [yearlyRevenue] = await pool.query(
            `SELECT COALESCE(SUM(sp.price_yearly), 0) as total 
       FROM companies c 
       JOIN subscription_plans sp ON c.subscription_plan_id = sp.id 
       WHERE c.subscription_status = 'active' AND c.deleted_at IS NULL`
        );

        // Revenu réel (factures payées ce mois)
        const [actualRevenueThisMonth] = await pool.query(
            `SELECT COALESCE(SUM(si.amount), 0) as total 
       FROM subscription_invoices si 
       WHERE si.status = 'paid' AND si.paid_at >= ?`,
            [firstDayOfMonth]
        );

        // Revenu réel (factures payées cette année)
        const [actualRevenueThisYear] = await pool.query(
            `SELECT COALESCE(SUM(si.amount), 0) as total 
       FROM subscription_invoices si 
       WHERE si.status = 'paid' AND si.paid_at >= ?`,
            [firstDayOfYear]
        );

        // ─── UTILISATEURS ─────────────────────────────────
        const [totalUsers] = await pool.query(
            'SELECT COUNT(*) as total FROM users WHERE is_active = 1'
        );

        const [newUsersToday] = await pool.query(
            'SELECT COUNT(*) as total FROM users WHERE DATE(created_at) = ?',
            [today]
        );

        const [newUsersThisMonth] = await pool.query(
            'SELECT COUNT(*) as total FROM users WHERE created_at >= ?',
            [firstDayOfMonth]
        );

        // ─── PRODUITS ─────────────────────────────────────
        const [totalProducts] = await pool.query(
            'SELECT COUNT(*) as total FROM products WHERE deleted_at IS NULL'
        );

        // ─── VENTES ───────────────────────────────────────
        const [totalSales] = await pool.query(
            "SELECT COUNT(*) as total FROM sales WHERE status = 'completed'"
        );

        const [totalSalesAmount] = await pool.query(
            "SELECT COALESCE(SUM(total_amount), 0) as total FROM sales WHERE status = 'completed'"
        );

        const [salesToday] = await pool.query(
            "SELECT COUNT(*) as total, COALESCE(SUM(total_amount), 0) as revenue FROM sales WHERE DATE(sale_date) = ? AND status = 'completed'",
            [today]
        );

        // ─── PAIEMENTS EN ATTENTE ─────────────────────────
        const [pendingPayments] = await pool.query(
            "SELECT COUNT(*) as total, COALESCE(SUM(amount), 0) as total_amount FROM subscription_payment_proofs WHERE status = 'pending'"
        );

        // ─── COMPANIES PAR TYPE ───────────────────────────
        const [companiesByType] = await pool.query(
            `SELECT bt.code, bt.name, COUNT(c.id) as total
       FROM business_types bt
       LEFT JOIN companies c ON c.business_type_id = bt.id AND c.deleted_at IS NULL
       GROUP BY bt.id, bt.code, bt.name
       ORDER BY total DESC`
        );

        // ─── COMPANIES PAR PLAN ───────────────────────────
        const [companiesByPlan] = await pool.query(
            `SELECT sp.code, sp.name, COUNT(c.id) as total
       FROM subscription_plans sp
       LEFT JOIN companies c ON c.subscription_plan_id = sp.id AND c.deleted_at IS NULL
       GROUP BY sp.id, sp.code, sp.name
       ORDER BY total DESC`
        );

        // ─── COMPANIES PAR STATUT ─────────────────────────
        const [companiesByStatus] = await pool.query(
            `SELECT subscription_status, COUNT(*) as total
       FROM companies
       WHERE deleted_at IS NULL
       GROUP BY subscription_status`
        );

        // ─── INSCRIPTIONS 12 DERNIERS MOIS ────────────────
        const [registrationsByMonth] = await pool.query(
            `SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as total
       FROM companies
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH) AND deleted_at IS NULL
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY month ASC`
        );

        // ─── REVENU 12 DERNIERS MOIS ──────────────────────
        const [revenueByMonth] = await pool.query(
            `SELECT 
        DATE_FORMAT(paid_at, '%Y-%m') as month,
        COALESCE(SUM(amount), 0) as total
       FROM subscription_invoices
       WHERE status = 'paid' AND paid_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
       GROUP BY DATE_FORMAT(paid_at, '%Y-%m')
       ORDER BY month ASC`
        );

        // ─── TOP COMPANIES (par ventes) ───────────────────
        const [topCompanies] = await pool.query(
            `SELECT c.id, c.name, c.logo_url, c.city, c.country,
              COUNT(s.id) as total_sales,
              COALESCE(SUM(s.total_amount), 0) as total_revenue
       FROM companies c
       LEFT JOIN sales s ON s.company_id = c.id AND s.status = 'completed'
       WHERE c.deleted_at IS NULL
       GROUP BY c.id, c.name, c.logo_url, c.city, c.country
       ORDER BY total_revenue DESC
       LIMIT 10`
        );

        // ─── DERNIÈRES INSCRIPTIONS ───────────────────────
        const [latestCompanies] = await pool.query(
            `SELECT c.id, c.name, c.slug, c.logo_url, c.city, c.country,
              c.subscription_status, c.created_at,
              bt.name as business_type_name,
              sp.name as plan_name
       FROM companies c
       JOIN business_types bt ON c.business_type_id = bt.id
       JOIN subscription_plans sp ON c.subscription_plan_id = sp.id
       WHERE c.deleted_at IS NULL
       ORDER BY c.created_at DESC
       LIMIT 10`
        );

        res.status(200).json({
            success: true,
            data: {
                // Stats globales
                total_companies: totalCompanies[0].total,
                active_companies: activeCompanies[0].total,
                new_companies_this_month: newCompaniesThisMonth[0].total,
                new_companies_today: newCompaniesToday[0].total,

                // Abonnements
                active_subscriptions: activeSubscriptions[0].total,
                expired_subscriptions: expiredSubscriptions[0].total,
                trial_companies: trialCompanies[0].total,

                // Revenu
                estimated_monthly_revenue: monthlyRevenue[0].total,
                estimated_yearly_revenue: yearlyRevenue[0].total,
                actual_revenue_this_month: actualRevenueThisMonth[0].total,
                actual_revenue_this_year: actualRevenueThisYear[0].total,

                // Utilisateurs
                total_users: totalUsers[0].total,
                new_users_today: newUsersToday[0].total,
                new_users_this_month: newUsersThisMonth[0].total,

                // Produits & Ventes
                total_products: totalProducts[0].total,
                total_sales: totalSales[0].total,
                total_sales_amount: totalSalesAmount[0].total,
                sales_today: salesToday[0],

                // Paiements en attente
                pending_payments_count: pendingPayments[0].total,
                pending_payments_amount: pendingPayments[0].total_amount,

                // Répartitions
                companies_by_type: companiesByType,
                companies_by_plan: companiesByPlan,
                companies_by_status: companiesByStatus,

                // Données temporelles
                registrations_by_month: registrationsByMonth,
                revenue_by_month: revenueByMonth,

                // Tops & Latest
                top_companies: topCompanies,
                latest_companies: latestCompanies,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getPlatformStats };