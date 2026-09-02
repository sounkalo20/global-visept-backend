// controllers/restaurant/space.controller.js
const pool = require('../../config/db');
const AppError = require('../../utils/AppError');

// ─── LISTER LES ESPACES ───────────────────────────────────
const getSpaces = async (req, res, next) => {
  try {
    const companyId = req.company.id;

    const [spaces] = await pool.query(
      `SELECT s.*,
              COUNT(t.id) AS tables_count
       FROM restaurant_spaces s
       LEFT JOIN restaurant_tables t ON t.space_id = s.id AND t.is_active = 1
       WHERE s.company_id = ?
       GROUP BY s.id
       ORDER BY s.sort_order ASC, s.name ASC`,
      [companyId]
    );

    res.status(200).json({ success: true, data: { spaces } });
  } catch (error) {
    next(error);
  }
};

// ─── CRÉER UN ESPACE ──────────────────────────────────────
const createSpace = async (req, res, next) => {
  try {
    const { name, description, sort_order } = req.body;
    const companyId = req.company.id;

    if (!name || name.trim() === '') {
      throw new AppError('Le nom de l\'espace est requis.', 400);
    }

    const [result] = await pool.query(
      `INSERT INTO restaurant_spaces (company_id, name, description, sort_order)
       VALUES (?, ?, ?, ?)`,
      [companyId, name.trim(), description || null, parseInt(sort_order) || 0]
    );

    const [spaces] = await pool.query('SELECT * FROM restaurant_spaces WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Espace créé avec succès.',
      data: { space: spaces[0] },
    });
  } catch (error) {
    next(error);
  }
};

// ─── MODIFIER UN ESPACE ───────────────────────────────────
const updateSpace = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.company.id;
    const { name, description, sort_order, is_active } = req.body;

    const [existing] = await pool.query(
      'SELECT * FROM restaurant_spaces WHERE id = ? AND company_id = ?',
      [id, companyId]
    );

    if (existing.length === 0) {
      throw new AppError('Espace introuvable.', 404);
    }

    const updates = [];
    const values = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name.trim()); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description || null); }
    if (sort_order !== undefined) { updates.push('sort_order = ?'); values.push(parseInt(sort_order) || 0); }
    if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active ? 1 : 0); }

    if (updates.length === 0) {
      throw new AppError('Aucune donnée à mettre à jour.', 400);
    }

    values.push(id);
    await pool.query(`UPDATE restaurant_spaces SET ${updates.join(', ')} WHERE id = ?`, values);

    const [updated] = await pool.query('SELECT * FROM restaurant_spaces WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Espace mis à jour avec succès.',
      data: { space: updated[0] },
    });
  } catch (error) {
    next(error);
  }
};

// ─── SUPPRIMER UN ESPACE ───────────────────────────────────
const deleteSpace = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.company.id;

    const [existing] = await pool.query(
      'SELECT * FROM restaurant_spaces WHERE id = ? AND company_id = ?',
      [id, companyId]
    );

    if (existing.length === 0) {
      throw new AppError('Espace introuvable.', 404);
    }

    const [tablesCount] = await pool.query(
      'SELECT COUNT(*) as total FROM restaurant_tables WHERE space_id = ? AND is_active = 1',
      [id]
    );

    if (tablesCount[0].total > 0) {
      // Soft deactivate
      await pool.query('UPDATE restaurant_spaces SET is_active = 0 WHERE id = ?', [id]);
      return res.status(200).json({
        success: true,
        message: 'Espace désactivé (contient des tables existantes).',
      });
    }

    await pool.query('DELETE FROM restaurant_spaces WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Espace supprimé.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSpaces,
  createSpace,
  updateSpace,
  deleteSpace,
};
