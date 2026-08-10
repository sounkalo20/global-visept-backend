// controllers/shop/dashboard.controller.js
const pool = require('../config/db');
const AppError = require('../utils/AppError');

const getDashboardStats = async (req, res, next) => {
    try {
        const companyId = req.company.id;
        
        // --- 1. Gestion des dates dynamiques ---
        const { startDate, endDate } = req.query;
        let start = new Date();
        start.setDate(start.getDate() - 30); // par défaut 30 jours
        start.setHours(0, 0, 0, 0);
        let end = new Date();
        end.setHours(23, 59, 59, 999);

        if (startDate) start = new Date(startDate);
        if (endDate) {
            end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
        }
        
        const startStr = start.toISOString().slice(0, 19).replace('T', ' ');
        const endStr = end.toISOString().slice(0, 19).replace('T', ' ');

        // --- 2. Calcul de la période précédente pour tendances ---
        const duration = end.getTime() - start.getTime();
        const prevEnd = new Date(start.getTime() - 1);
        const prevStart = new Date(prevEnd.getTime() - duration);
        const prevStartStr = prevStart.toISOString().slice(0, 19).replace('T', ' ');
        const prevEndStr = prevEnd.toISOString().slice(0, 19).replace('T', ' ');

        // ─── VENTES & MARGE (Période Actuelle) ──────────────────────────────
        const [currentSales] = await pool.query(
            `SELECT 
                COUNT(*) as total_sales,
                COALESCE(SUM(total_amount - returned_amount), 0) as total_revenue,
                COALESCE(SUM(returned_amount), 0) as total_returned,
                COALESCE(SUM(amount_paid), 0) as total_paid,
                COALESCE(SUM(amount_due), 0) as total_due,
                COALESCE(AVG(total_amount - returned_amount), 0) as average_sale
             FROM sales
             WHERE company_id = ? AND sale_date BETWEEN ? AND ? AND status = 'completed'`,
            [companyId, startStr, endStr]
        );

        // Récupérer le coût d'achat pour calculer la marge (Current)
        const [currentCost] = await pool.query(
            `SELECT COALESCE(SUM(si.quantity * p.cost_price), 0) as total_cost
             FROM sale_items si
             JOIN sales s ON si.sale_id = s.id
             JOIN products p ON si.product_id = p.id
             WHERE s.company_id = ? AND s.sale_date BETWEEN ? AND ? AND s.status = 'completed'`,
            [companyId, startStr, endStr]
        );
        const currentMargin = currentSales[0].total_revenue - currentCost[0].total_cost;

        // ─── VENTES & MARGE (Période Précédente) ────────────────────────────
        const [prevSales] = await pool.query(
            `SELECT 
                COUNT(*) as total_sales,
                COALESCE(SUM(total_amount - returned_amount), 0) as total_revenue
             FROM sales
             WHERE company_id = ? AND sale_date BETWEEN ? AND ? AND status = 'completed'`,
            [companyId, prevStartStr, prevEndStr]
        );

        const [prevCost] = await pool.query(
            `SELECT COALESCE(SUM(si.quantity * p.cost_price), 0) as total_cost
             FROM sale_items si
             JOIN sales s ON si.sale_id = s.id
             JOIN products p ON si.product_id = p.id
             WHERE s.company_id = ? AND s.sale_date BETWEEN ? AND ? AND s.status = 'completed'`,
            [companyId, prevStartStr, prevEndStr]
        );
        const prevMargin = prevSales[0].total_revenue - prevCost[0].total_cost;

        // Fonction pour calculer la tendance en %
        const getTrend = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100);
        };

        const revenueTrend = getTrend(currentSales[0].total_revenue, prevSales[0].total_revenue);
        const marginTrend = getTrend(currentMargin, prevMargin);
        const salesCountTrend = getTrend(currentSales[0].total_sales, prevSales[0].total_sales);

        // ─── ÉVOLUTION DES VENTES & MARGE (Graphique ligne) ─────────────────
        // Regrouper par jour
        const [salesEvolution] = await pool.query(
            `SELECT 
                DATE(s.sale_date) as date,
                COUNT(DISTINCT s.id) as count,
                COALESCE(SUM(s.total_amount - s.returned_amount), 0) as revenue,
                COALESCE(SUM(si.quantity * p.cost_price), 0) as cost
             FROM sales s
             LEFT JOIN sale_items si ON si.sale_id = s.id
             LEFT JOIN products p ON si.product_id = p.id
             WHERE s.company_id = ? AND s.status = 'completed'
               AND s.sale_date BETWEEN ? AND ?
             GROUP BY DATE(s.sale_date)
             ORDER BY date ASC`,
            [companyId, startStr, endStr]
        );

        // Calcul de la marge pour l'évolution
        const evolutionFormatted = salesEvolution.map(item => ({
            date: item.date,
            count: item.count,
            revenue: parseFloat(item.revenue),
            margin: parseFloat(item.revenue) - parseFloat(item.cost || 0)
        }));

        // ─── VENTES PAR HEURE D'AFFLUENCE ──────────────────────────────────
        const [hourlySales] = await pool.query(
            `SELECT 
                HOUR(sale_date) as hour,
                COUNT(*) as count,
                COALESCE(SUM(total_amount - returned_amount), 0) as revenue
             FROM sales
             WHERE company_id = ? AND status = 'completed'
               AND sale_date BETWEEN ? AND ?
             GROUP BY HOUR(sale_date)
             ORDER BY hour ASC`,
            [companyId, startStr, endStr]
        );

        // ─── VENTES PAR CATÉGORIE ──────────────────────────────────────────
        const [salesByCategory] = await pool.query(
            `SELECT 
                c.name as category_name,
                SUM(si.quantity) as total_quantity,
                SUM(si.total_price) as total_revenue
             FROM sale_items si
             JOIN sales s ON si.sale_id = s.id
             JOIN products p ON si.product_id = p.id
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE s.company_id = ? AND s.status = 'completed'
               AND s.sale_date BETWEEN ? AND ?
             GROUP BY c.id, c.name
             ORDER BY total_revenue DESC`,
            [companyId, startStr, endStr]
        );

        // ─── VENTES PAR MÉTHODE DE PAIEMENT ────────────────────────────────
        const [salesByPayment] = await pool.query(
            `SELECT 
                payment_method,
                COUNT(*) as count,
                COALESCE(SUM(total_amount - returned_amount), 0) as total
             FROM sales
             WHERE company_id = ? AND status = 'completed'
               AND sale_date BETWEEN ? AND ?
             GROUP BY payment_method`,
            [companyId, startStr, endStr]
        );

        // ─── TOP PRODUITS ────────────────────────────────────────────────
        const [topProducts] = await pool.query(
            `SELECT p.id, p.name, p.image_url,
                SUM(si.quantity) as total_sold,
                SUM(si.total_price) as total_revenue
             FROM sale_items si
             JOIN products p ON si.product_id = p.id
             JOIN sales s ON si.sale_id = s.id
             WHERE s.company_id = ? AND s.status = 'completed'
               AND s.sale_date BETWEEN ? AND ?
               AND p.product_type = 'product'
             GROUP BY p.id, p.name, p.image_url
             ORDER BY total_sold DESC
             LIMIT 5`,
            [companyId, startStr, endStr]
        );

        // ─── TOP CLIENTS ────────────────────────────────────────────────
        const [topClients] = await pool.query(
            `SELECT c.id, c.full_name, c.phone,
                COUNT(s.id) as total_purchases,
                COALESCE(SUM(s.total_amount - s.returned_amount), 0) as total_spent
             FROM sales s
             JOIN clients c ON s.client_id = c.id
             WHERE s.company_id = ? AND s.status = 'completed'
               AND s.sale_date BETWEEN ? AND ?
             GROUP BY c.id, c.full_name, c.phone
             ORDER BY total_spent DESC
             LIMIT 5`,
            [companyId, startStr, endStr]
        );

        // ─── DETTES CLIENTS EN COURS (Globales) ──────────────────────────
        const [debts] = await pool.query(
            `SELECT 
                COUNT(*) as total_debts,
                COALESCE(SUM(remaining_amount), 0) as total_remaining,
                COUNT(CASE WHEN due_date IS NOT NULL AND due_date < CURDATE() AND status NOT IN ('paid', 'canceled') THEN 1 END) as overdue_count
             FROM client_debts
             WHERE company_id = ?`,
            [companyId]
        );

        // ─── DÉPENSES (Période) ──────────────────────────────────────────
        const [expenses] = await pool.query(
            `SELECT 
                COUNT(*) as total_expenses,
                COALESCE(SUM(amount), 0) as total_amount
             FROM expenses
             WHERE company_id = ? AND expense_date BETWEEN ? AND ? AND deleted_at IS NULL`,
            [companyId, startStr, endStr]
        );

        // ─── ÉTAT DES STOCKS (Global) ────────────────────────────────────
        const [products] = await pool.query(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN manage_stock = 1 AND current_stock <= low_stock_threshold AND current_stock > 0 THEN 1 ELSE 0 END) as low_stock,
                SUM(CASE WHEN manage_stock = 1 AND current_stock <= 0 THEN 1 ELSE 0 END) as out_of_stock
             FROM products
             WHERE company_id = ? AND product_type = 'product' AND deleted_at IS NULL AND is_active = 1`,
            [companyId]
        );

        res.status(200).json({
            success: true,
            data: {
                period: {
                    start: startStr,
                    end: endStr
                },
                summary: {
                    total_sales: currentSales[0].total_sales,
                    sales_trend: salesCountTrend,
                    total_revenue: currentSales[0].total_revenue,
                    revenue_trend: revenueTrend,
                    total_returned: currentSales[0].total_returned,
                    average_sale: currentSales[0].average_sale,
                    gross_margin: currentMargin,
                    margin_trend: marginTrend
                },
                debts: debts[0],
                expenses: expenses[0],
                products: products[0],
                top_products: topProducts,
                top_clients: topClients,
                evolution: evolutionFormatted,
                hourly_sales: hourlySales,
                sales_by_category: salesByCategory,
                sales_by_payment: salesByPayment,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getDashboardStats };