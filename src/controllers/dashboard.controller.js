// controllers/shop/dashboard.controller.js
const pool = require('../config/db');
const AppError = require('../utils/AppError');

const getDashboardStats = async (req, res, next) => {
    try {
        const companyId = req.company.id;

        // ─── DATES : paramètres ou défaut = mois en cours ─────────
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        const defaultStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

        const startDate = req.query.start_date || defaultStart;
        const endDate   = req.query.end_date   || today;

        // ─── STATISTIQUES GLOBALES (sur la période) ───────────────
        const [periodStats] = await pool.query(
            `SELECT 
        COUNT(*) as total_sales,
        COALESCE(SUM(total_amount - returned_amount), 0) as total_revenue,
        COALESCE(SUM(returned_amount), 0) as total_returned,
        COALESCE(AVG(total_amount - returned_amount), 0) as average_sale,
        COUNT(DISTINCT client_id) as unique_clients
       FROM sales
       WHERE company_id = ? AND DATE(sale_date) BETWEEN ? AND ? AND status = 'completed'`,
            [companyId, startDate, endDate]
        );

        // ─── DETTES CLIENTS (état actuel — pas de filtre date) ────
        const [debts] = await pool.query(
            `SELECT 
        COUNT(*) as total_debts,
        COALESCE(SUM(remaining_amount), 0) as total_remaining,
        COUNT(CASE WHEN due_date IS NOT NULL AND due_date < CURDATE() AND status NOT IN ('paid', 'canceled') THEN 1 END) as overdue_count
       FROM client_debts
       WHERE company_id = ?`,
            [companyId]
        );

        // ─── DÉPENSES (sur la période) ────────────────────────────
        const [expenses] = await pool.query(
            `SELECT 
        COUNT(*) as total_expenses,
        COALESCE(SUM(amount), 0) as total_amount
       FROM expenses
       WHERE company_id = ? AND expense_date BETWEEN ? AND ? AND deleted_at IS NULL`,
            [companyId, startDate, endDate]
        );

        // ─── PRODUITS (état actuel — pas de filtre date) ──────────
        const [products] = await pool.query(
            `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN manage_stock = 1 AND current_stock <= low_stock_threshold AND current_stock > 0 THEN 1 ELSE 0 END) as low_stock,
        SUM(CASE WHEN manage_stock = 1 AND current_stock <= 0 THEN 1 ELSE 0 END) as out_of_stock
       FROM products
       WHERE company_id = ? AND product_type = 'product' AND deleted_at IS NULL AND is_active = 1`,
            [companyId]
        );

        // ─── CLIENTS (état actuel — pas de filtre date) ───────────
        const [clients] = await pool.query(
            `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN current_debt > 0 THEN 1 ELSE 0 END) as with_debt
       FROM clients
       WHERE company_id = ? AND deleted_at IS NULL AND is_active = 1`,
            [companyId]
        );

        // ─── FOURNISSEURS (état actuel — pas de filtre date) ──────
        const [suppliers] = await pool.query(
            `SELECT 
        COUNT(*) as total,
        COALESCE(SUM(current_balance), 0) as total_debt
       FROM suppliers
       WHERE company_id = ? AND deleted_at IS NULL AND is_active = 1`,
            [companyId]
        );

        // ─── TOP PRODUITS (sur la période) ───────────────────────
        const [topProducts] = await pool.query(
            `SELECT p.id, p.name, p.image_url,
              SUM(si.quantity) as total_sold,
              SUM(si.total_price) as total_revenue
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       JOIN sales s ON si.sale_id = s.id
       WHERE s.company_id = ? AND s.status = 'completed'
         AND DATE(s.sale_date) BETWEEN ? AND ?
         AND p.product_type = 'product'
       GROUP BY p.id, p.name, p.image_url
       ORDER BY total_sold DESC
       LIMIT 10`,
            [companyId, startDate, endDate]
        );

        // ─── TOP CLIENTS (sur la période) ────────────────────────
        const [topClients] = await pool.query(
            `SELECT c.id, c.full_name, c.phone,
              COUNT(s.id) as total_purchases,
              COALESCE(SUM(s.total_amount - s.returned_amount), 0) as total_spent
       FROM sales s
       JOIN clients c ON s.client_id = c.id
       WHERE s.company_id = ? AND s.status = 'completed'
         AND DATE(s.sale_date) BETWEEN ? AND ?
       GROUP BY c.id, c.full_name, c.phone
       ORDER BY total_spent DESC
       LIMIT 5`,
            [companyId, startDate, endDate]
        );

        // ─── ÉVOLUTION DES VENTES (sur la période, groupé par jour) ─
        const [weeklySales] = await pool.query(
            `SELECT 
        DATE(sale_date) as date,
        COUNT(*) as count,
        COALESCE(SUM(total_amount - returned_amount), 0) as revenue
       FROM sales
       WHERE company_id = ? AND status = 'completed'
         AND DATE(sale_date) BETWEEN ? AND ?
       GROUP BY DATE(sale_date)
       ORDER BY date ASC`,
            [companyId, startDate, endDate]
        );

        // ─── VENTES PAR MÉTHODE DE PAIEMENT (sur la période) ─────
        const [salesByPayment] = await pool.query(
            `SELECT 
        payment_method,
        COUNT(*) as count,
        COALESCE(SUM(total_amount - returned_amount), 0) as total
       FROM sales
       WHERE company_id = ? AND status = 'completed'
         AND DATE(sale_date) BETWEEN ? AND ?
       GROUP BY payment_method`,
            [companyId, startDate, endDate]
        );

        res.status(200).json({
            success: true,
            data: {
                period: { start: startDate, end: endDate },
                summary: periodStats[0],
                debts: debts[0],
                expenses: expenses[0],
                products: products[0],
                clients: clients[0],
                suppliers: suppliers[0],
                top_products: topProducts,
                top_clients: topClients,
                weekly_sales: weeklySales,
                sales_by_payment: salesByPayment,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getDashboardStats };