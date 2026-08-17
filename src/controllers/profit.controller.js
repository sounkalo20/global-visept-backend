// controllers/profit.controller.js
const pool = require('../config/db');
const AppError = require('../utils/AppError');

/**
 * Utilitaire pour formater et calculer les plages de dates
 */
function parseDateRange(query) {
  const { period, startDate, endDate } = query;
  const now = new Date();
  let start = new Date();
  let end = new Date();
  end.setHours(23, 59, 59, 999);

  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'yesterday':
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;
    case 'this_week': {
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case 'last_week': {
      const lastWeekDay = start.getDay();
      const lastWeekDiff = start.getDate() - lastWeekDay + (lastWeekDay === 0 ? -6 : 1) - 7;
      start.setDate(lastWeekDiff);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'this_month':
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      break;
    case 'last_month':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    case 'this_year':
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      break;
    case 'custom':
      if (startDate) start = new Date(startDate);
      if (endDate) {
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
      }
      break;
    default:
      if (startDate && endDate) {
        start = new Date(startDate);
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
      } else {
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      }
      break;
  }

  const duration = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - duration);

  const formatDate = (d) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const formatShort = (d) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  return {
    start,
    end,
    startStr: formatDate(start),
    endStr: formatDate(end),
    startShort: formatShort(start),
    endShort: formatShort(end),
    prevStart,
    prevEnd,
    prevStartStr: formatDate(prevStart),
    prevEndStr: formatDate(prevEnd),
    prevStartShort: formatShort(prevStart),
    prevEndShort: formatShort(prevEnd),
    durationDays: Math.max(1, Math.ceil(duration / (1000 * 60 * 60 * 24)))
  };
}

const getTrend = (current, previous) => {
  if (!previous || previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
};

/**
 * 1. Synthèse globale des Bénéfices & KPI
 * GET /api/profits/summary
 */
exports.getProfitSummary = async (req, res, next) => {
  try {
    const companyId = req.company.id;
    const { category_id, seller_id, payment_method, product_id } = req.query;
    const dates = parseDateRange(req.query);

    // Clause additionnelle pour les filtres
    let extraSaleFilters = '';
    const extraSaleParams = [];

    if (seller_id) {
      extraSaleFilters += ' AND s.seller_id = ?';
      extraSaleParams.push(seller_id);
    }
    if (payment_method) {
      extraSaleFilters += ' AND s.payment_method = ?';
      extraSaleParams.push(payment_method);
    }

    let extraItemFilters = '';
    const extraItemParams = [];

    if (category_id) {
      extraItemFilters += ' AND p.category_id = ?';
      extraItemParams.push(category_id);
    }
    if (product_id) {
      extraItemFilters += ' AND p.id = ?';
      extraItemParams.push(product_id);
    }

    // --- Période Courante : Ventes globales ---
    const salesSummaryQuery = `
      SELECT 
        COUNT(DISTINCT s.id) as total_sales_count,
        COALESCE(SUM(s.subtotal), 0) as total_gross_revenue,
        COALESCE(SUM(s.discount_amount), 0) as total_discounts,
        COALESCE(SUM(s.returned_amount), 0) as total_returns,
        COALESCE(SUM(s.total_amount - s.returned_amount), 0) as total_net_revenue
      FROM sales s
      WHERE s.company_id = ? 
        AND s.status != 'canceled'
        AND s.sale_date BETWEEN ? AND ?
        ${extraSaleFilters}
    `;

    const [currentSales] = await pool.query(salesSummaryQuery, [companyId, dates.startStr, dates.endStr, ...extraSaleParams]);
    const [prevSales] = await pool.query(salesSummaryQuery, [companyId, dates.prevStartStr, dates.prevEndStr, ...extraSaleParams]);

    // --- Période Courante : COGS, Marge & Produits à coût inconnu ---
    const cogsQuery = `
      SELECT 
        COALESCE(SUM(
          CASE 
            WHEN COALESCE(si.cost_price, p.cost_price, 0) > 0 
            THEN (si.quantity - COALESCE(sri_sub.returned_qty, 0)) * COALESCE(si.cost_price, p.cost_price, 0)
            ELSE 0 
          END
        ), 0) as total_cogs,
        
        COALESCE(SUM(
          CASE 
            WHEN COALESCE(si.cost_price, p.cost_price, 0) > 0 
            THEN (si.total_price - COALESCE(sri_sub.returned_amount, 0) - COALESCE(s.discount_amount * (si.total_price / NULLIF(s.subtotal, 0)), 0))
            ELSE 0 
          END
        ), 0) as evaluated_net_revenue,
        
        COALESCE(SUM(
          CASE 
            WHEN COALESCE(si.cost_price, p.cost_price, 0) <= 0 
            THEN (si.total_price - COALESCE(sri_sub.returned_amount, 0) - COALESCE(s.discount_amount * (si.total_price / NULLIF(s.subtotal, 0)), 0))
            ELSE 0 
          END
        ), 0) as unpriced_net_revenue,

        COUNT(DISTINCT CASE WHEN COALESCE(si.cost_price, p.cost_price, 0) <= 0 THEN si.product_id END) as unpriced_products_count,
        COUNT(DISTINCT si.product_id) as total_distinct_products_sold

      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN products p ON si.product_id = p.id
      LEFT JOIN (
        SELECT sale_item_id, SUM(quantity) as returned_qty, SUM(total_price) as returned_amount
        FROM sale_return_items
        GROUP BY sale_item_id
      ) sri_sub ON sri_sub.sale_item_id = si.id
      WHERE s.company_id = ? 
        AND s.status != 'canceled'
        AND s.sale_date BETWEEN ? AND ?
        ${extraSaleFilters}
        ${extraItemFilters}
    `;

    const [currentCogsRows] = await pool.query(cogsQuery, [companyId, dates.startStr, dates.endStr, ...extraSaleParams, ...extraItemParams]);
    const [prevCogsRows] = await pool.query(cogsQuery, [companyId, dates.prevStartStr, dates.prevEndStr, ...extraSaleParams, ...extraItemParams]);

    const currentCogs = currentCogsRows[0];
    const prevCogs = prevCogsRows[0];

    // --- Dépenses d'exploitation ---
    const expensesQuery = `
      SELECT 
        COALESCE(SUM(amount), 0) as total_expenses,
        COUNT(*) as expenses_count
      FROM expenses
      WHERE company_id = ?
        AND expense_date BETWEEN ? AND ?
        AND deleted_at IS NULL
    `;

    const [currentExpenses] = await pool.query(expensesQuery, [companyId, dates.startShort, dates.endShort]);
    const [prevExpenses] = await pool.query(expensesQuery, [companyId, dates.prevStartShort, dates.prevEndShort]);

    // Calculs de rentabilité actuels
    const totalNetRevenue = parseFloat(currentSales[0].total_net_revenue || 0);
    const evaluatedRevenue = parseFloat(currentCogs.evaluated_net_revenue || 0);
    const unpricedRevenue = parseFloat(currentCogs.unpriced_net_revenue || 0);
    const totalCogs = parseFloat(currentCogs.total_cogs || 0);
    const totalExpenses = parseFloat(currentExpenses[0].total_expenses || 0);

    const grossMargin = evaluatedRevenue - totalCogs;
    const grossMarginPercentage = evaluatedRevenue > 0 ? (grossMargin / evaluatedRevenue) * 100 : 0;
    const netProfit = grossMargin - totalExpenses;
    const netProfitMarginPercentage = totalNetRevenue > 0 ? (netProfit / totalNetRevenue) * 100 : 0;

    // Calculs de rentabilité précédents
    const prevTotalNetRevenue = parseFloat(prevSales[0].total_net_revenue || 0);
    const prevEvaluatedRevenue = parseFloat(prevCogs.evaluated_net_revenue || 0);
    const prevTotalCogs = parseFloat(prevCogs.total_cogs || 0);
    const prevTotalExpenses = parseFloat(prevExpenses[0].total_expenses || 0);
    const prevGrossMargin = prevEvaluatedRevenue - prevTotalCogs;
    const prevNetProfit = prevGrossMargin - prevTotalExpenses;

    res.json({
      success: true,
      data: {
        dateRange: {
          start: dates.startStr,
          end: dates.endStr,
          durationDays: dates.durationDays
        },
        revenue: {
          grossRevenue: parseFloat(currentSales[0].total_gross_revenue || 0),
          discounts: parseFloat(currentSales[0].total_discounts || 0),
          returns: parseFloat(currentSales[0].total_returns || 0),
          netRevenue: totalNetRevenue,
          evaluatedRevenue,
          unpricedRevenue,
          salesCount: parseInt(currentSales[0].total_sales_count || 0),
          trend: getTrend(totalNetRevenue, prevTotalNetRevenue)
        },
        cogs: {
          totalCogs,
          trend: getTrend(totalCogs, prevTotalCogs)
        },
        grossMargin: {
          amount: grossMargin,
          percentage: Math.round(grossMarginPercentage * 10) / 10,
          trend: getTrend(grossMargin, prevGrossMargin)
        },
        expenses: {
          totalExpenses,
          count: parseInt(currentExpenses[0].expenses_count || 0),
          trend: getTrend(totalExpenses, prevTotalExpenses)
        },
        netProfit: {
          amount: netProfit,
          percentage: Math.round(netProfitMarginPercentage * 10) / 10,
          trend: getTrend(netProfit, prevNetProfit)
        },
        dataHealth: {
          unpricedProductsCount: parseInt(currentCogs.unpriced_products_count || 0),
          totalDistinctProductsSold: parseInt(currentCogs.total_distinct_products_sold || 0),
          hasUnpricedProducts: parseInt(currentCogs.unpriced_products_count || 0) > 0,
          coveragePercentage: totalNetRevenue > 0 ? Math.round((evaluatedRevenue / totalNetRevenue) * 100) : 100
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Évolution temporelle (Revenu, Coût, Marge, Dépenses, Bénéfice Net)
 * GET /api/profits/evolution
 */
exports.getProfitEvolution = async (req, res, next) => {
  try {
    const companyId = req.company.id;
    const dates = parseDateRange(req.query);

    // Déterminer la granularité
    let dateFormat = '%Y-%m-%d';
    let expenseDateFormat = '%Y-%m-%d';

    if (dates.durationDays > 180) {
      dateFormat = '%Y-%m';
      expenseDateFormat = '%Y-%m';
    } else if (dates.durationDays > 35) {
      dateFormat = '%x-W%v'; // Année-Semaine
      expenseDateFormat = '%x-W%v';
    }

    // 1. Évolution des ventes et marges
    const salesTimelineQuery = `
      SELECT 
        DATE_FORMAT(s.sale_date, '${dateFormat}') as time_bucket,
        MIN(DATE(s.sale_date)) as bucket_date,
        COUNT(DISTINCT s.id) as sales_count,
        COALESCE(SUM(si.total_price - COALESCE(sri_sub.returned_amount, 0) - COALESCE(s.discount_amount * (si.total_price / NULLIF(s.subtotal, 0)), 0)), 0) as revenue,
        COALESCE(SUM(
          CASE 
            WHEN COALESCE(si.cost_price, p.cost_price, 0) > 0 
            THEN (si.quantity - COALESCE(sri_sub.returned_qty, 0)) * COALESCE(si.cost_price, p.cost_price, 0)
            ELSE 0 
          END
        ), 0) as cogs
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN products p ON si.product_id = p.id
      LEFT JOIN (
        SELECT sale_item_id, SUM(quantity) as returned_qty, SUM(total_price) as returned_amount
        FROM sale_return_items
        GROUP BY sale_item_id
      ) sri_sub ON sri_sub.sale_item_id = si.id
      WHERE s.company_id = ? 
        AND s.status != 'canceled'
        AND s.sale_date BETWEEN ? AND ?
      GROUP BY time_bucket
      ORDER BY bucket_date ASC
    `;

    const [salesTimeline] = await pool.query(salesTimelineQuery, [companyId, dates.startStr, dates.endStr]);

    // 2. Évolution des dépenses
    const expensesTimelineQuery = `
      SELECT 
        DATE_FORMAT(expense_date, '${expenseDateFormat}') as time_bucket,
        COALESCE(SUM(amount), 0) as total_expenses
      FROM expenses
      WHERE company_id = ?
        AND expense_date BETWEEN ? AND ?
        AND deleted_at IS NULL
      GROUP BY time_bucket
    `;

    const [expensesTimeline] = await pool.query(expensesTimelineQuery, [companyId, dates.startShort, dates.endShort]);

    const expenseMap = new Map();
    expensesTimeline.forEach(e => {
      expenseMap.set(e.time_bucket, parseFloat(e.total_expenses || 0));
    });

    // Combiner les séries
    const timeline = salesTimeline.map(s => {
      const rev = parseFloat(s.revenue || 0);
      const cogs = parseFloat(s.cogs || 0);
      const margin = rev - cogs;
      const exp = expenseMap.get(s.time_bucket) || 0;
      const net = margin - exp;

      return {
        date: s.time_bucket,
        formattedDate: s.bucket_date,
        salesCount: parseInt(s.sales_count || 0),
        revenue: rev,
        cogs: cogs,
        grossMargin: margin,
        expenses: exp,
        netProfit: net,
        marginPercentage: rev > 0 ? Math.round((margin / rev) * 100) : 0
      };
    });

    res.json({
      success: true,
      data: timeline
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Rentabilité par Catégorie
 * GET /api/profits/categories
 */
exports.getCategoryProfits = async (req, res, next) => {
  try {
    const companyId = req.company.id;
    const dates = parseDateRange(req.query);

    const query = `
      SELECT 
        COALESCE(c.id, 0) as category_id,
        COALESCE(c.name, 'Sans catégorie') as category_name,
        c.color as category_color,
        COUNT(DISTINCT si.product_id) as products_count,
        COALESCE(SUM(si.quantity - COALESCE(sri_sub.returned_qty, 0)), 0) as net_quantity,
        COALESCE(SUM(si.total_price - COALESCE(sri_sub.returned_amount, 0) - COALESCE(s.discount_amount * (si.total_price / NULLIF(s.subtotal, 0)), 0)), 0) as net_revenue,
        COALESCE(SUM(
          CASE 
            WHEN COALESCE(si.cost_price, p.cost_price, 0) > 0 
            THEN (si.quantity - COALESCE(sri_sub.returned_qty, 0)) * COALESCE(si.cost_price, p.cost_price, 0)
            ELSE 0 
          END
        ), 0) as cogs,
        COALESCE(SUM(
          CASE 
            WHEN COALESCE(si.cost_price, p.cost_price, 0) > 0 
            THEN (si.total_price - COALESCE(sri_sub.returned_amount, 0) - COALESCE(s.discount_amount * (si.total_price / NULLIF(s.subtotal, 0)), 0)) - ((si.quantity - COALESCE(sri_sub.returned_qty, 0)) * COALESCE(si.cost_price, p.cost_price, 0))
            ELSE 0 
          END
        ), 0) as gross_margin
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN products p ON si.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN (
        SELECT sale_item_id, SUM(quantity) as returned_qty, SUM(total_price) as returned_amount
        FROM sale_return_items
        GROUP BY sale_item_id
      ) sri_sub ON sri_sub.sale_item_id = si.id
      WHERE s.company_id = ? 
        AND s.status != 'canceled'
        AND s.sale_date BETWEEN ? AND ?
      GROUP BY c.id, c.name, c.color
      ORDER BY gross_margin DESC
    `;

    const [rows] = await pool.query(query, [companyId, dates.startStr, dates.endStr]);

    const formatted = rows.map(r => {
      const rev = parseFloat(r.net_revenue || 0);
      const margin = parseFloat(r.gross_margin || 0);
      return {
        categoryId: r.category_id,
        categoryName: r.category_name,
        categoryColor: r.category_color || '#6366F1',
        productsCount: parseInt(r.products_count || 0),
        netQuantity: parseFloat(r.net_quantity || 0),
        netRevenue: rev,
        cogs: parseFloat(r.cogs || 0),
        grossMargin: margin,
        marginPercentage: rev > 0 ? Math.round((margin / rev) * 1000) / 10 : 0
      };
    });

    res.json({
      success: true,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Rentabilité détaillée par Produit
 * GET /api/profits/products
 */
exports.getProductProfits = async (req, res, next) => {
  try {
    const companyId = req.company.id;
    const { category_id, search, filter_type = 'all', sort_by = 'margin_desc', page = 1, limit = 50 } = req.query;
    const dates = parseDateRange(req.query);

    let filterClauses = '';
    const filterParams = [];

    if (category_id) {
      filterClauses += ' AND p.category_id = ?';
      filterParams.push(category_id);
    }

    if (search && search.trim()) {
      filterClauses += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)';
      const term = `%${search.trim()}%`;
      filterParams.push(term, term, term);
    }

    const query = `
      SELECT 
        p.id as product_id,
        p.name as product_name,
        p.sku,
        p.barcode,
        COALESCE(c.name, 'Sans catégorie') as category_name,
        p.retail_price as current_retail_price,
        p.cost_price as current_cost_price,
        
        COALESCE(SUM(si.quantity), 0) as sold_quantity,
        COALESCE(SUM(sri_sub.returned_qty), 0) as returned_quantity,
        COALESCE(SUM(si.quantity - COALESCE(sri_sub.returned_qty, 0)), 0) as net_quantity,
        
        COALESCE(SUM(si.total_price), 0) as gross_revenue,
        COALESCE(SUM(sri_sub.returned_amount), 0) as returned_amount,
        COALESCE(SUM(s.discount_amount * (si.total_price / NULLIF(s.subtotal, 0))), 0) as prorated_discounts,
        
        COALESCE(SUM(si.total_price - COALESCE(sri_sub.returned_amount, 0) - COALESCE(s.discount_amount * (si.total_price / NULLIF(s.subtotal, 0)), 0)), 0) as net_revenue,
        
        AVG(COALESCE(si.cost_price, p.cost_price, 0)) as avg_unit_cost,
        
        COALESCE(SUM(
          CASE 
            WHEN COALESCE(si.cost_price, p.cost_price, 0) > 0 
            THEN (si.quantity - COALESCE(sri_sub.returned_qty, 0)) * COALESCE(si.cost_price, p.cost_price, 0)
            ELSE 0 
          END
        ), 0) as total_cogs,
        
        COALESCE(SUM(
          CASE 
            WHEN COALESCE(si.cost_price, p.cost_price, 0) > 0 
            THEN (si.total_price - COALESCE(sri_sub.returned_amount, 0) - COALESCE(s.discount_amount * (si.total_price / NULLIF(s.subtotal, 0)), 0)) - ((si.quantity - COALESCE(sri_sub.returned_qty, 0)) * COALESCE(si.cost_price, p.cost_price, 0))
            ELSE 0 
          END
        ), 0) as gross_margin,
        
        CASE 
          WHEN AVG(COALESCE(si.cost_price, p.cost_price, 0)) > 0 THEN 1 
          ELSE 0 
        END as is_cost_known

      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN products p ON si.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN (
        SELECT sale_item_id, SUM(quantity) as returned_qty, SUM(total_price) as returned_amount
        FROM sale_return_items
        GROUP BY sale_item_id
      ) sri_sub ON sri_sub.sale_item_id = si.id
      WHERE s.company_id = ? 
        AND s.status != 'canceled'
        AND s.sale_date BETWEEN ? AND ?
        ${filterClauses}
      GROUP BY p.id, p.name, p.sku, p.barcode, c.name, p.retail_price, p.cost_price
    `;

    const [rows] = await pool.query(query, [companyId, dates.startStr, dates.endStr, ...filterParams]);

    let products = rows.map(r => {
      const netRev = parseFloat(r.net_revenue || 0);
      const margin = parseFloat(r.gross_margin || 0);
      const isCostKnown = r.is_cost_known === 1;
      const marginPct = (isCostKnown && netRev > 0) ? Math.round((margin / netRev) * 1000) / 10 : 0;

      let marginStatus = 'healthy'; // > 30%
      if (!isCostKnown) {
        marginStatus = 'unknown_cost';
      } else if (margin < 0) {
        marginStatus = 'negative';
      } else if (marginPct <= 15) {
        marginStatus = 'low';
      }

      return {
        productId: r.product_id,
        productName: r.product_name,
        sku: r.sku,
        barcode: r.barcode,
        categoryName: r.category_name,
        currentRetailPrice: parseFloat(r.current_retail_price || 0),
        currentCostPrice: parseFloat(r.current_cost_price || 0),
        avgUnitCost: parseFloat(r.avg_unit_cost || 0),
        soldQuantity: parseFloat(r.sold_quantity || 0),
        returnedQuantity: parseFloat(r.returned_quantity || 0),
        netQuantity: parseFloat(r.net_quantity || 0),
        grossRevenue: parseFloat(r.gross_revenue || 0),
        returnedAmount: parseFloat(r.returned_amount || 0),
        discounts: parseFloat(r.prorated_discounts || 0),
        netRevenue: netRev,
        cogs: parseFloat(r.total_cogs || 0),
        grossMargin: margin,
        marginPercentage: marginPct,
        isCostKnown,
        marginStatus
      };
    });

    // Filtrage secondaire selon filter_type
    if (filter_type === 'unknown_cost') {
      products = products.filter(p => !p.isCostKnown);
    } else if (filter_type === 'low_or_negative') {
      products = products.filter(p => p.marginStatus === 'low' || p.marginStatus === 'negative');
    } else if (filter_type === 'profitable') {
      products = products.filter(p => p.isCostKnown && p.grossMargin > 0);
    }

    // Tri
    switch (sort_by) {
      case 'margin_desc':
        products.sort((a, b) => b.grossMargin - a.grossMargin);
        break;
      case 'margin_asc':
        products.sort((a, b) => a.grossMargin - b.grossMargin);
        break;
      case 'margin_pct_desc':
        products.sort((a, b) => b.marginPercentage - a.marginPercentage);
        break;
      case 'revenue_desc':
        products.sort((a, b) => b.netRevenue - a.netRevenue);
        break;
      case 'quantity_desc':
        products.sort((a, b) => b.netQuantity - a.netQuantity);
        break;
      default:
        products.sort((a, b) => b.grossMargin - a.grossMargin);
        break;
    }

    const totalCount = products.length;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const paginatedProducts = products.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({
      success: true,
      data: {
        products: paginatedProducts,
        pagination: {
          total: totalCount,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalCount / limitNum)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
