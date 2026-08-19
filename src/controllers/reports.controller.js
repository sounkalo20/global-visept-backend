// src/controllers/reports.controller.js
const pool = require('../config/db');
const AppError = require('../utils/AppError');

/**
 * GET /api/reports/stock-valuation
 * Valeur totale du stock et répartition par catégorie
 */
const getStockValuation = async (req, res, next) => {
  try {
    const companyId = req.company.id;

    // 1. Métriques globales du stock boutique
    const [globalSummary] = await pool.query(
      `SELECT 
        COUNT(id) AS total_products,
        SUM(CASE WHEN current_stock > 0 THEN 1 ELSE 0 END) AS in_stock_products,
        SUM(CASE WHEN current_stock <= 0 THEN 1 ELSE 0 END) AS out_of_stock_products,
        SUM(CASE WHEN current_stock > 0 AND current_stock <= low_stock_threshold THEN 1 ELSE 0 END) AS low_stock_products,
        COALESCE(SUM(current_stock), 0) AS total_units_in_stock,
        COALESCE(SUM(current_stock * cost_price), 0) AS total_cost_value,
        COALESCE(SUM(current_stock * retail_price), 0) AS total_retail_value,
        COALESCE(SUM(current_stock * (retail_price - cost_price)), 0) AS potential_gross_margin
       FROM products
       WHERE company_id = ?
         AND deleted_at IS NULL
         AND manage_stock = 1`,
      [companyId]
    );

    const summary = globalSummary[0] || {};
    const totalCost = parseFloat(summary.total_cost_value || 0);
    const totalRetail = parseFloat(summary.total_retail_value || 0);
    const potentialMargin = parseFloat(summary.potential_gross_margin || 0);
    const marginRate = totalRetail > 0 ? (potentialMargin / totalRetail) * 100 : 0;

    // 2. Répartition par catégorie
    const [categoriesValuation] = await pool.query(
      `SELECT 
        COALESCE(c.id, 0) AS category_id,
        COALESCE(c.name, 'Sans catégorie') AS category_name,
        COUNT(p.id) AS product_count,
        COALESCE(SUM(p.current_stock), 0) AS total_units,
        COALESCE(SUM(p.current_stock * p.cost_price), 0) AS cost_value,
        COALESCE(SUM(p.current_stock * p.retail_price), 0) AS retail_value,
        COALESCE(SUM(p.current_stock * (p.retail_price - p.cost_price)), 0) AS category_margin,
        SUM(CASE WHEN p.current_stock <= p.low_stock_threshold THEN 1 ELSE 0 END) AS low_stock_count
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.company_id = ?
         AND p.deleted_at IS NULL
         AND p.manage_stock = 1
       GROUP BY c.id, c.name
       ORDER BY cost_value DESC`,
      [companyId]
    );

    // 3. Top 10 des produits les plus valorisés en stock
    const [topValuedProducts] = await pool.query(
      `SELECT 
        p.id, p.name, p.sku, p.barcode, p.current_stock, p.cost_price, p.retail_price,
        (p.current_stock * p.cost_price) AS stock_cost_value,
        (p.current_stock * p.retail_price) AS stock_retail_value,
        COALESCE(c.name, 'Sans catégorie') AS category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.company_id = ?
         AND p.deleted_at IS NULL
         AND p.manage_stock = 1
         AND p.current_stock > 0
       ORDER BY stock_cost_value DESC
       LIMIT 10`,
      [companyId]
    );

    res.status(200).json({
      success: true,
      data: {
        summary: {
          total_products: parseInt(summary.total_products || 0),
          in_stock_products: parseInt(summary.in_stock_products || 0),
          out_of_stock_products: parseInt(summary.out_of_stock_products || 0),
          low_stock_products: parseInt(summary.low_stock_products || 0),
          total_units_in_stock: parseFloat(summary.total_units_in_stock || 0),
          total_cost_value: totalCost,
          total_retail_value: totalRetail,
          potential_gross_margin: potentialMargin,
          margin_rate: parseFloat(marginRate.toFixed(2)),
        },
        categories: categoriesValuation.map((cat) => ({
          ...cat,
          product_count: parseInt(cat.product_count),
          total_units: parseFloat(cat.total_units),
          cost_value: parseFloat(cat.cost_value),
          retail_value: parseFloat(cat.retail_value),
          category_margin: parseFloat(cat.category_margin),
          percentage_of_total_value:
            totalCost > 0 ? parseFloat(((parseFloat(cat.cost_value) / totalCost) * 100).toFixed(2)) : 0,
        })),
        top_products: topValuedProducts,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/stock-movements
 * Historique des mouvements de stocks avec filtres
 */
const getStockMovementsReport = async (req, res, next) => {
  try {
    const companyId = req.company.id;
    const {
      movement_type,
      product_id,
      category_id,
      startDate,
      endDate,
      page = 1,
      limit = 30,
    } = req.query;

    let query = `
      SELECT 
        im.*,
        p.name AS product_name,
        p.sku AS product_sku,
        p.barcode AS product_barcode,
        c.name AS category_name,
        CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) AS performed_by_name
      FROM inventory_movements im
      JOIN products p ON im.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON im.performed_by = u.id
      WHERE im.company_id = ?
    `;
    const params = [companyId];

    if (movement_type && movement_type !== 'all') {
      query += ` AND im.movement_type = ?`;
      params.push(movement_type);
    }

    if (product_id) {
      query += ` AND im.product_id = ?`;
      params.push(product_id);
    }

    if (category_id) {
      query += ` AND p.category_id = ?`;
      params.push(category_id);
    }

    if (startDate) {
      query += ` AND im.created_at >= ?`;
      params.push(`${startDate} 00:00:00`);
    }

    if (endDate) {
      query += ` AND im.created_at <= ?`;
      params.push(`${endDate} 23:59:59`);
    }

    // Totaux agrégés
    const summaryQuery = `
      SELECT 
        COUNT(*) AS total_movements,
        COALESCE(SUM(CASE WHEN im.quantity > 0 THEN im.quantity ELSE 0 END), 0) AS total_in_qty,
        COALESCE(SUM(CASE WHEN im.quantity < 0 THEN ABS(im.quantity) ELSE 0 END), 0) AS total_out_qty,
        COALESCE(SUM(CASE WHEN im.quantity > 0 THEN im.quantity * COALESCE(im.unit_cost, p.cost_price, 0) ELSE 0 END), 0) AS total_in_value,
        COALESCE(SUM(CASE WHEN im.quantity < 0 THEN ABS(im.quantity) * COALESCE(im.unit_cost, p.cost_price, 0) ELSE 0 END), 0) AS total_out_value
      FROM inventory_movements im
      JOIN products p ON im.product_id = p.id
      WHERE im.company_id = ?
      ${movement_type && movement_type !== 'all' ? 'AND im.movement_type = ?' : ''}
      ${product_id ? 'AND im.product_id = ?' : ''}
      ${category_id ? 'AND p.category_id = ?' : ''}
      ${startDate ? 'AND im.created_at >= ?' : ''}
      ${endDate ? 'AND im.created_at <= ?' : ''}
    `;
    const [summaryRows] = await pool.query(summaryQuery, params);

    // Pagination
    query += ` ORDER BY im.created_at DESC LIMIT ? OFFSET ?`;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    const [movements] = await pool.query(query, params);

    res.status(200).json({
      success: true,
      data: {
        summary: summaryRows[0] || {},
        movements,
        pagination: {
          total: summaryRows[0]?.total_movements || 0,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil((summaryRows[0]?.total_movements || 0) / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/stock-rotation
 * Analyse de la rotation des stocks (Produits rapides vs lents vs dormants)
 */
const getStockRotationReport = async (req, res, next) => {
  try {
    const companyId = req.company.id;
    const { days = 30 } = req.query;
    const daysInt = parseInt(days) || 30;

    const [products] = await pool.query(
      `SELECT 
        p.id,
        p.name,
        p.sku,
        p.barcode,
        p.current_stock,
        p.cost_price,
        p.retail_price,
        (p.current_stock * p.cost_price) AS stock_value,
        c.name AS category_name,
        COALESCE(ABS(SUM(im.quantity)), 0) AS total_sold_qty,
        COALESCE(ABS(SUM(im.quantity * COALESCE(im.unit_cost, p.cost_price, 0))), 0) AS total_cogs,
        COALESCE(COUNT(DISTINCT im.reference_id), 0) AS transaction_count,
        ROUND(COALESCE(ABS(SUM(im.quantity)), 0) / ?, 2) AS daily_velocity
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN inventory_movements im ON (
         im.product_id = p.id 
         AND im.company_id = p.company_id 
         AND im.movement_type = 'sale'
         AND im.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       )
       WHERE p.company_id = ?
         AND p.deleted_at IS NULL
         AND p.manage_stock = 1
       GROUP BY p.id
       ORDER BY total_sold_qty DESC`,
      [daysInt, daysInt, companyId]
    );

    // Classifier les produits en 3 catégories
    const fastMovers = [];
    const slowMovers = [];
    const deadStock = [];

    for (const prod of products) {
      const sold = parseFloat(prod.total_sold_qty || 0);
      const stock = parseFloat(prod.current_stock || 0);

      if (sold === 0 && stock > 0) {
        deadStock.push({
          ...prod,
          rotation_status: 'dead_stock',
          rotation_label: 'Stock dormant (0 vente)',
        });
      } else if (sold >= 10 || parseFloat(prod.daily_velocity) >= 0.3) {
        fastMovers.push({
          ...prod,
          rotation_status: 'fast_mover',
          rotation_label: 'Forte rotation',
        });
      } else {
        slowMovers.push({
          ...prod,
          rotation_status: 'slow_mover',
          rotation_label: 'Rotation faible/modérée',
        });
      }
    }

    const deadStockValue = deadStock.reduce((acc, p) => acc + parseFloat(p.stock_value || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        analyzed_period_days: daysInt,
        summary: {
          total_analyzed_products: products.length,
          fast_movers_count: fastMovers.length,
          slow_movers_count: slowMovers.length,
          dead_stock_count: deadStock.length,
          dead_stock_value: deadStockValue,
        },
        fast_movers: fastMovers,
        slow_movers: slowMovers,
        dead_stock: deadStock,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/inventory-comparison
 * Comparer deux sessions d'inventaire physique
 */
const compareInventoryCounts = async (req, res, next) => {
  try {
    const companyId = req.company.id;
    const { count1_id, count2_id } = req.query;

    if (!count1_id || !count2_id) {
      throw new AppError('Les identifiants des deux inventaires (count1_id et count2_id) sont requis.', 400);
    }

    const [counts] = await pool.query(
      `SELECT * FROM inventory_counts WHERE id IN (?, ?) AND company_id = ?`,
      [count1_id, count2_id, companyId]
    );

    if (counts.length < 2) {
      throw new AppError('L\'un des inventaires spécifiés est introuvable.', 404);
    }

    const count1 = counts.find((c) => String(c.id) === String(count1_id));
    const count2 = counts.find((c) => String(c.id) === String(count2_id));

    // Comparaison article par article
    const [comparisonRows] = await pool.query(
      `SELECT 
        p.id AS product_id,
        p.name AS product_name,
        p.sku,
        COALESCE(c.name, 'Sans catégorie') AS category_name,
        i1.theoretical_qty AS count1_theoretical,
        i1.counted_qty AS count1_counted,
        i1.difference AS count1_diff,
        i1.discrepancy_value AS count1_diff_value,
        i2.theoretical_qty AS count2_theoretical,
        i2.counted_qty AS count2_counted,
        i2.difference AS count2_diff,
        i2.discrepancy_value AS count2_diff_value,
        (COALESCE(i2.difference, 0) - COALESCE(i1.difference, 0)) AS diff_evolution
       FROM inventory_count_items i1
       FULL JOIN inventory_count_items i2 ON i1.product_id = i2.product_id AND i2.inventory_count_id = ?
       JOIN products p ON COALESCE(i1.product_id, i2.product_id) = p.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE i1.inventory_count_id = ? OR i2.inventory_count_id = ?
       ORDER BY p.name ASC`,
      [count2_id, count1_id, count2_id]
    ).catch(async () => {
      // Fallback si FULL JOIN n'est pas supporté (MySQL standard)
      return await pool.query(
        `SELECT 
          p.id AS product_id,
          p.name AS product_name,
          p.sku,
          COALESCE(cat.name, 'Sans catégorie') AS category_name,
          i1.theoretical_qty AS count1_theoretical,
          i1.counted_qty AS count1_counted,
          i1.difference AS count1_diff,
          i1.discrepancy_value AS count1_diff_value,
          i2.theoretical_qty AS count2_theoretical,
          i2.counted_qty AS count2_counted,
          i2.difference AS count2_diff,
          i2.discrepancy_value AS count2_diff_value,
          (COALESCE(i2.difference, 0) - COALESCE(i1.difference, 0)) AS diff_evolution
         FROM products p
         LEFT JOIN inventory_count_items i1 ON p.id = i1.product_id AND i1.inventory_count_id = ?
         LEFT JOIN inventory_count_items i2 ON p.id = i2.product_id AND i2.inventory_count_id = ?
         LEFT JOIN categories cat ON p.category_id = cat.id
         WHERE (i1.id IS NOT NULL OR i2.id IS NOT NULL) AND p.company_id = ?
         ORDER BY p.name ASC`,
        [count1_id, count2_id, companyId]
      );
    });

    res.status(200).json({
      success: true,
      data: {
        count1: {
          id: count1.id,
          reference: count1.reference,
          name: count1.name,
          status: count1.status,
          date: count1.completed_at || count1.created_at,
          total_discrepancy_value: parseFloat(count1.total_discrepancy_value || 0),
        },
        count2: {
          id: count2.id,
          reference: count2.reference,
          name: count2.name,
          status: count2.status,
          date: count2.completed_at || count2.created_at,
          total_discrepancy_value: parseFloat(count2.total_discrepancy_value || 0),
        },
        items: comparisonRows,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/stock-valuation/export
 * Exporter la valorisation du stock en CSV
 */
const exportStockValuation = async (req, res, next) => {
  try {
    const companyId = req.company.id;

    const [products] = await pool.query(
      `SELECT 
        p.id, p.name, p.sku, p.barcode,
        COALESCE(c.name, 'Sans catégorie') AS category_name,
        p.current_stock,
        p.cost_price,
        p.retail_price,
        (p.current_stock * p.cost_price) AS cost_value,
        (p.current_stock * p.retail_price) AS retail_value,
        (p.current_stock * (p.retail_price - p.cost_price)) AS potential_margin
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.company_id = ?
         AND p.deleted_at IS NULL
         AND p.manage_stock = 1
       ORDER BY category_name ASC, p.name ASC`,
      [companyId]
    );

    const rows = [
      ['ID', 'Produit', 'SKU', 'Code barre', 'Catégorie', 'Stock actuel', 'Prix d\'achat', 'Prix de vente', 'Valeur stock (Achat)', 'Valeur stock (Vente)', 'Marge potentielle'],
    ];

    for (const p of products) {
      rows.push([
        p.id,
        `"${(p.name || '').replace(/"/g, '""')}"`,
        p.sku || '-',
        p.barcode || '-',
        `"${(p.category_name || '').replace(/"/g, '""')}"`,
        parseFloat(p.current_stock || 0).toFixed(3),
        parseFloat(p.cost_price || 0).toFixed(2),
        parseFloat(p.retail_price || 0).toFixed(2),
        parseFloat(p.cost_value || 0).toFixed(2),
        parseFloat(p.retail_value || 0).toFixed(2),
        parseFloat(p.potential_margin || 0).toFixed(2),
      ]);
    }

    const csvContent = '\uFEFF' + rows.map((r) => r.join(';')).join('\n');
    const dateStr = new Date().toISOString().slice(0, 10);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=valorisation_stock_${dateStr}.csv`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStockValuation,
  getStockMovementsReport,
  getStockRotationReport,
  compareInventoryCounts,
  exportStockValuation,
};
