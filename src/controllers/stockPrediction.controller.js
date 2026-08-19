// src/controllers/stockPrediction.controller.js
const pool = require('../config/db');
const AppError = require('../utils/AppError');

/**
 * GET /api/stock-predictions
 * Analyse prédictive des ruptures de stock basée sur la vélocité des ventes
 */
const getStockPredictions = async (req, res, next) => {
  try {
    const companyId = req.company.id;
    const {
      days_window = 30,
      threshold_days = 14,
      category_id,
      risk_level,
      search,
    } = req.query;

    const windowDays = Math.max(1, parseInt(days_window) || 30);
    const thresholdDays = parseFloat(threshold_days) || 14;

    // 1. Récupération des données produits et ventes sur la fenêtre demandée
    let query = `
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.barcode,
        p.image_url,
        p.current_stock,
        p.low_stock_threshold,
        p.cost_price,
        p.retail_price,
        COALESCE(c.name, 'Sans catégorie') AS category_name,
        -- Total des ventes sur la période (quantité brute vendue)
        COALESCE(ABS(SUM(im.quantity)), 0) AS total_sold_in_window,
        -- Nombre distinct de transactions / ventes
        COALESCE(COUNT(DISTINCT im.reference_id), 0) AS sales_transactions_count,
        -- Date de la dernière vente
        MAX(im.created_at) AS last_sale_at
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
        AND p.is_active = 1
    `;
    const params = [windowDays, companyId];

    if (category_id && category_id !== 'all') {
      query += ` AND p.category_id = ?`;
      params.push(category_id);
    }

    if (search) {
      query += ` AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    query += ` GROUP BY p.id ORDER BY p.name ASC`;

    const [rows] = await pool.query(query, params);

    // 2. Traitement et calcul des prédictions
    const now = new Date();
    const predictions = [];

    let countOutOfStock = 0;
    let countCritical = 0; // < 3 jours
    let countHigh = 0; // 3 à 7 jours
    let countMedium = 0; // 7 à 14 jours
    let countLowRisk = 0; // 14+ jours

    for (const row of rows) {
      const currentStock = parseFloat(row.current_stock || 0);
      const lowThreshold = parseFloat(row.low_stock_threshold || 5);
      const totalSold = parseFloat(row.total_sold_in_window || 0);
      const txCount = parseInt(row.sales_transactions_count || 0);
      const avgDailySales = totalSold > 0 ? parseFloat((totalSold / windowDays).toFixed(2)) : 0;

      // Calcul des jours restants estimés
      let daysRemaining = null;
      let predictedDate = null;
      let risk = 'low_risk';
      let riskLabel = 'Stock suffisant';

      if (currentStock <= 0) {
        risk = 'out_of_stock';
        riskLabel = 'En rupture totale';
        daysRemaining = 0;
        countOutOfStock++;
      } else if (avgDailySales > 0) {
        daysRemaining = parseFloat((currentStock / avgDailySales).toFixed(1));
        const estDate = new Date(now.getTime() + daysRemaining * 24 * 60 * 60 * 1000);
        predictedDate = estDate.toISOString().split('T')[0];

        if (daysRemaining < 3) {
          risk = 'critical';
          riskLabel = 'Rupture imminente (< 3j)';
          countCritical++;
        } else if (daysRemaining <= 7) {
          risk = 'high';
          riskLabel = 'Risque élevé (3 à 7j)';
          countHigh++;
        } else if (daysRemaining <= thresholdDays) {
          risk = 'medium';
          riskLabel = 'Risque modéré (7 à 14j)';
          countMedium++;
        } else {
          risk = 'low_risk';
          riskLabel = 'Stock suffisant (> 14j)';
          countLowRisk++;
        }
      } else {
        // Aucune vente sur la fenêtre d'analyse
        if (currentStock <= lowThreshold) {
          risk = 'critical';
          riskLabel = 'Stock sous le seuil d\'alerte (0 vente)';
          daysRemaining = null;
          countCritical++;
        } else {
          risk = 'low_risk';
          riskLabel = 'Aucune vente récente';
          daysRemaining = null;
          countLowRisk++;
        }
      }

      // Évaluation de la fiabilité / confiance
      let confidenceLevel = 'high';
      let confidenceReason = 'Historique suffisant et représentatif';

      if (totalSold === 0) {
        confidenceLevel = 'low';
        confidenceReason = `Aucune vente enregistrée sur les ${windowDays} derniers jours`;
      } else if (txCount < 3) {
        confidenceLevel = 'low';
        confidenceReason = `Très peu de transactions (${txCount} vente(s)) — estimation indicative`;
      } else if (txCount < 6 || windowDays < 15) {
        confidenceLevel = 'moderate';
        confidenceReason = `Échantillon modéré (${txCount} ventes) — estimation à confirmer`;
      }

      // Quantité recommandée pour 30 jours de stock de sécurité
      const targetDailyRate = avgDailySales > 0 ? avgDailySales : (lowThreshold / 10);
      const recommendedReorderQty = Math.ceil(
        Math.max(targetDailyRate * 30 - currentStock, lowThreshold * 2)
      );

      predictions.push({
        id: row.id,
        name: row.name,
        sku: row.sku,
        barcode: row.barcode,
        image_url: row.image_url,
        category_name: row.category_name,
        current_stock: currentStock,
        low_stock_threshold: lowThreshold,
        cost_price: parseFloat(row.cost_price || 0),
        retail_price: parseFloat(row.retail_price || 0),
        analyzed_window_days: windowDays,
        history: {
          total_sold_in_window: totalSold,
          sales_transactions_count: txCount,
          last_sale_at: row.last_sale_at,
          avg_daily_sales: avgDailySales,
        },
        prediction: {
          days_remaining: daysRemaining,
          predicted_stockout_date: predictedDate,
          risk_level: risk,
          risk_label: riskLabel,
          confidence_level: confidenceLevel,
          confidence_reason: confidenceReason,
          recommended_reorder_qty: recommendedReorderQty,
          estimated_reorder_cost: recommendedReorderQty * parseFloat(row.cost_price || 0),
        },
      });
    }

    // Filtrer par niveau de risque si spécifié
    let filteredPredictions = predictions;
    if (risk_level && risk_level !== 'all') {
      filteredPredictions = predictions.filter((p) => p.prediction.risk_level === risk_level);
    }

    // Trier les plus urgents en premier
    filteredPredictions.sort((a, b) => {
      const riskOrder = { out_of_stock: 0, critical: 1, high: 2, medium: 3, low_risk: 4 };
      if (riskOrder[a.prediction.risk_level] !== riskOrder[b.prediction.risk_level]) {
        return riskOrder[a.prediction.risk_level] - riskOrder[b.prediction.risk_level];
      }
      if (a.prediction.days_remaining !== null && b.prediction.days_remaining !== null) {
        return a.prediction.days_remaining - b.prediction.days_remaining;
      }
      return (a.prediction.days_remaining === null ? 1 : -1);
    });

    res.status(200).json({
      success: true,
      data: {
        window_days: windowDays,
        summary: {
          total_monitored_products: rows.length,
          out_of_stock_count: countOutOfStock,
          critical_risk_count: countCritical,
          high_risk_count: countHigh,
          medium_risk_count: countMedium,
          low_risk_count: countLowRisk,
          urgent_actions_needed: countOutOfStock + countCritical + countHigh,
        },
        predictions: filteredPredictions,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStockPredictions,
};
