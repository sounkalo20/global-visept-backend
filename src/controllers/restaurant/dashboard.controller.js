// controllers/restaurant/dashboard.controller.js (REMPLACER)
const pool = require('../../config/db');
const AppError = require('../../utils/AppError');

const getDashboardStats = async (req, res, next) => {
    try {
        const companyId = req.company.id;
        const today = new Date().toISOString().split('T')[0];
        const firstDayOfMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;

        // ─── VENTES DU JOUR ──────────────────────────────
        const [todaySales] = await pool.query(
            `SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(AVG(total_amount), 0) as average_order,
        COUNT(DISTINCT client_id) as unique_clients
       FROM sales
       WHERE company_id = ? AND DATE(sale_date) = ? AND status = 'completed'`,
            [companyId, today]
        );

        // ─── VENTES DU MOIS ──────────────────────────────
        const [monthSales] = await pool.query(
            `SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(amount_paid), 0) as total_paid,
        COALESCE(SUM(amount_due), 0) as total_due
       FROM sales
       WHERE company_id = ? AND DATE(sale_date) >= ? AND status = 'completed'`,
            [companyId, firstDayOfMonth]
        );

        // ─── DETTES CLIENTS ──────────────────────────────
        const [debts] = await pool.query(
            `SELECT 
        COUNT(*) as total_debts,
        COALESCE(SUM(remaining_amount), 0) as total_remaining,
        COUNT(CASE WHEN due_date IS NOT NULL AND due_date < CURDATE() AND status NOT IN ('paid', 'canceled') THEN 1 END) as overdue_count
       FROM client_debts
       WHERE company_id = ?`,
            [companyId]
        );

        // ─── DÉPENSES DU MOIS ────────────────────────────
        const [expenses] = await pool.query(
            `SELECT 
        COUNT(*) as total_expenses,
        COALESCE(SUM(amount), 0) as total_amount
       FROM expenses
       WHERE company_id = ? AND expense_date >= ? AND deleted_at IS NULL`,
            [companyId, firstDayOfMonth]
        );

        // ─── PLATS ───────────────────────────────────────
        const [dishes] = await pool.query(
            `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_available = 1 THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN is_available = 0 THEN 1 ELSE 0 END) as unavailable
       FROM products
       WHERE company_id = ? AND product_type = 'dish' AND deleted_at IS NULL AND is_active = 1`,
            [companyId]
        );

        // ─── CLIENTS ─────────────────────────────────────
        const [clients] = await pool.query(
            `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN current_debt > 0 THEN 1 ELSE 0 END) as with_debt
       FROM clients
       WHERE company_id = ? AND deleted_at IS NULL AND is_active = 1`,
            [companyId]
        );

        // ─── TOP PLATS (30 jours) ────────────────────────
        const [topDishes] = await pool.query(
            `SELECT p.id, p.name, p.image_url,
              SUM(si.quantity) as total_sold,
              SUM(si.total_price) as total_revenue
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       JOIN sales s ON si.sale_id = s.id
       WHERE s.company_id = ? AND s.status = 'completed'
         AND s.sale_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
         AND p.product_type = 'dish'
       GROUP BY p.id, p.name, p.image_url
       ORDER BY total_sold DESC
       LIMIT 10`,
            [companyId]
        );

        // ─── TOP CLIENTS (30 jours) ──────────────────────
        const [topClients] = await pool.query(
            `SELECT c.id, c.full_name, c.phone,
              COUNT(s.id) as total_visits,
              COALESCE(SUM(s.total_amount), 0) as total_spent
       FROM sales s
       JOIN clients c ON s.client_id = c.id
       WHERE s.company_id = ? AND s.status = 'completed'
         AND s.sale_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY c.id, c.full_name, c.phone
       ORDER BY total_spent DESC
       LIMIT 5`,
            [companyId]
        );

        // ─── VENTES 7 DERNIERS JOURS ─────────────────────
        const [weeklySales] = await pool.query(
            `SELECT 
        DATE(sale_date) as date,
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as revenue
       FROM sales
       WHERE company_id = ? AND status = 'completed'
         AND sale_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(sale_date)
       ORDER BY date ASC`,
            [companyId]
        );

        // ─── VENTES PAR MÉTHODE DE PAIEMENT (mois) ───────
        const [salesByPayment] = await pool.query(
            `SELECT 
        payment_method,
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as total
       FROM sales
       WHERE company_id = ? AND status = 'completed'
         AND DATE(sale_date) >= ?
       GROUP BY payment_method`,
            [companyId, firstDayOfMonth]
        );

        // ─── VENTES PAR HEURE (aujourd'hui) ──────────────
        const [salesByHour] = await pool.query(
            `SELECT 
        HOUR(sale_date) as hour,
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as revenue
       FROM sales
       WHERE company_id = ? AND status = 'completed'
         AND DATE(sale_date) = ?
       GROUP BY HOUR(sale_date)
       ORDER BY hour ASC`,
            [companyId, today]
        );

        res.status(200).json({
            success: true,
            data: {
                today: todaySales[0],
                this_month: monthSales[0],
                debts: debts[0],
                expenses: expenses[0],
                dishes: dishes[0],
                clients: clients[0],
                top_dishes: topDishes,
                top_clients: topClients,
                weekly_sales: weeklySales,
                sales_by_payment: salesByPayment,
                sales_by_hour: salesByHour,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getDashboardStats };