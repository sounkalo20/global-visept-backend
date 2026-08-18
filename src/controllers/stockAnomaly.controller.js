const pool = require('../config/db');
const AppError = require('../utils/AppError');

/**
 * GET /api/stock-anomalies?company_id=X&status=pending
 * Lister les anomalies de survente / stock pour le gérant.
 */
const getStockAnomalies = async (req, res, next) => {
  try {
    const companyId = req.company.id;
    const { status = 'pending', page = 1, limit = 20 } = req.query;

    let query = `
      SELECT sa.*, 
             p.name as product_name, p.sku as product_sku, p.barcode as product_barcode, p.image_url,
             s.sale_number, s.sale_date,
             u.first_name as resolved_by_first_name, u.last_name as resolved_by_last_name
      FROM stock_anomalies sa
      JOIN products p ON sa.product_id = p.id
      LEFT JOIN sales s ON sa.sale_id = s.id
      LEFT JOIN users u ON sa.resolved_by = u.id
      WHERE sa.company_id = ?
    `;
    const params = [companyId];

    if (status && status !== 'all') {
      query += ' AND sa.status = ?';
      params.push(status);
    }

    query += ' ORDER BY sa.created_at DESC';

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [anomalies] = await pool.query(query, params);

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM stock_anomalies WHERE company_id = ? ${status && status !== 'all' ? 'AND status = ?' : ''}`,
      status && status !== 'all' ? [companyId, status] : [companyId]
    );

    res.status(200).json({
      success: true,
      data: {
        anomalies,
        pagination: {
          total: countResult[0]?.total || 0,
          page: parseInt(page),
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/stock-anomalies/:id/resolve
 * Régulariser une anomalie de survente.
 */
const resolveStockAnomaly = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.company.id;
    const userId = req.user.id;
    const { status = 'resolved_by_inventory', notes } = req.body;

    const [existing] = await pool.query(
      'SELECT id FROM stock_anomalies WHERE id = ? AND company_id = ?',
      [id, companyId]
    );

    if (existing.length === 0) {
      throw new AppError('Anomalie introuvable.', 404);
    }

    await pool.query(
      `UPDATE stock_anomalies 
       SET status = ?, resolved_at = NOW(), resolved_by = ?, notes = COALESCE(?, notes)
       WHERE id = ?`,
      [status, userId, notes || null, id]
    );

    res.status(200).json({
      success: true,
      message: 'Anomalie régularisée avec succès.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStockAnomalies,
  resolveStockAnomaly,
};
