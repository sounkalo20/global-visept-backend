// controllers/restaurant/modifier.controller.js
const pool = require('../../config/db');
const AppError = require('../../utils/AppError');

// ═══════════════════════════════════════════════════════════
//  GROUPES DE MODIFICATEURS
// ═══════════════════════════════════════════════════════════

// ─── Lister les groupes d'une entreprise ─────────────────
const getModifierGroups = async (req, res, next) => {
  try {
    const companyId = req.company.id;

    const [groups] = await pool.query(
      `SELECT g.*,
              COUNT(o.id) AS options_count
       FROM modifier_groups g
       LEFT JOIN modifier_options o ON o.modifier_group_id = g.id AND o.is_active = 1
       WHERE g.company_id = ?
       GROUP BY g.id
       ORDER BY g.sort_order ASC, g.name ASC`,
      [companyId]
    );

    // Charger les options de chaque groupe
    for (const group of groups) {
      const [options] = await pool.query(
        `SELECT * FROM modifier_options
         WHERE modifier_group_id = ?
         ORDER BY sort_order ASC, name ASC`,
        [group.id]
      );
      group.options = options;
    }

    res.status(200).json({ success: true, data: { groups } });
  } catch (error) {
    next(error);
  }
};

// ─── Créer un groupe ──────────────────────────────────────
const createModifierGroup = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { name, description, is_required, min_choices, max_choices, sort_order, options } = req.body;
    const companyId = req.company.id;

    if (!name || name.trim() === '') throw new AppError('Le nom du groupe est requis.', 400);

    const maxC = parseInt(max_choices) || 1;
    const minC = parseInt(min_choices) || 0;
    const required = is_required ? 1 : 0;

    if (required && minC < 1) {
      throw new AppError('Un groupe obligatoire doit avoir au moins 1 choix minimum.', 400);
    }
    if (maxC > 0 && minC > maxC) {
      throw new AppError('Le minimum de choix ne peut pas dépasser le maximum.', 400);
    }

    const [result] = await connection.query(
      `INSERT INTO modifier_groups
         (company_id, name, description, is_required, min_choices, max_choices, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [companyId, name.trim(), description || null, required, minC, maxC, sort_order || 0]
    );

    const groupId = result.insertId;

    // Insérer les options si fournies
    if (options && Array.isArray(options) && options.length > 0) {
      for (let i = 0; i < options.length; i++) {
        const opt = options[i];
        if (!opt.name || opt.name.trim() === '') continue;
        await connection.query(
          `INSERT INTO modifier_options (modifier_group_id, name, extra_price, sort_order)
           VALUES (?, ?, ?, ?)`,
          [groupId, opt.name.trim(), parseFloat(opt.extra_price) || 0, opt.sort_order ?? i]
        );
      }
    }

    await connection.commit();

    const [groups] = await connection.query(
      `SELECT g.*, COUNT(o.id) AS options_count
       FROM modifier_groups g
       LEFT JOIN modifier_options o ON o.modifier_group_id = g.id
       WHERE g.id = ?
       GROUP BY g.id`,
      [groupId]
    );
    const [opts] = await connection.query(
      'SELECT * FROM modifier_options WHERE modifier_group_id = ? ORDER BY sort_order ASC',
      [groupId]
    );

    res.status(201).json({
      success: true,
      message: 'Groupe de modificateurs créé.',
      data: { group: { ...groups[0], options: opts } },
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// ─── Modifier un groupe ───────────────────────────────────
const updateModifierGroup = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const companyId = req.company.id;
    const { name, description, is_required, min_choices, max_choices, sort_order, is_active, options } = req.body;

    const [existing] = await connection.query(
      'SELECT * FROM modifier_groups WHERE id = ? AND company_id = ?',
      [id, companyId]
    );
    if (existing.length === 0) throw new AppError('Groupe introuvable.', 404);

    const updates = [];
    const values = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name.trim()); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description || null); }
    if (is_required !== undefined) { updates.push('is_required = ?'); values.push(is_required ? 1 : 0); }
    if (min_choices !== undefined) { updates.push('min_choices = ?'); values.push(parseInt(min_choices) || 0); }
    if (max_choices !== undefined) { updates.push('max_choices = ?'); values.push(parseInt(max_choices) || 1); }
    if (sort_order !== undefined) { updates.push('sort_order = ?'); values.push(sort_order); }
    if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active ? 1 : 0); }

    if (updates.length > 0) {
      values.push(id);
      await connection.query(`UPDATE modifier_groups SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    // Remplacer toutes les options si fournies
    if (options !== undefined && Array.isArray(options)) {
      await connection.query('DELETE FROM modifier_options WHERE modifier_group_id = ?', [id]);
      for (let i = 0; i < options.length; i++) {
        const opt = options[i];
        if (!opt.name || opt.name.trim() === '') continue;
        await connection.query(
          `INSERT INTO modifier_options (modifier_group_id, name, extra_price, sort_order, is_active)
           VALUES (?, ?, ?, ?, ?)`,
          [id, opt.name.trim(), parseFloat(opt.extra_price) || 0, opt.sort_order ?? i, opt.is_active !== false ? 1 : 0]
        );
      }
    }

    await connection.commit();

    const [groups] = await connection.query(
      'SELECT * FROM modifier_groups WHERE id = ?', [id]
    );
    const [opts] = await connection.query(
      'SELECT * FROM modifier_options WHERE modifier_group_id = ? ORDER BY sort_order ASC', [id]
    );

    res.status(200).json({
      success: true,
      message: 'Groupe mis à jour.',
      data: { group: { ...groups[0], options: opts } },
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// ─── Supprimer un groupe ──────────────────────────────────
const deleteModifierGroup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.company.id;

    const [existing] = await pool.query(
      'SELECT * FROM modifier_groups WHERE id = ? AND company_id = ?',
      [id, companyId]
    );
    if (existing.length === 0) throw new AppError('Groupe introuvable.', 404);

    // Désactiver au lieu de supprimer si utilisé dans des ventes
    const [usageCheck] = await pool.query(
      'SELECT COUNT(*) AS total FROM sale_item_modifier_choices WHERE modifier_group_id = ?',
      [id]
    );

    if (usageCheck[0].total > 0) {
      await pool.query('UPDATE modifier_groups SET is_active = 0 WHERE id = ?', [id]);
      return res.status(200).json({
        success: true,
        message: 'Groupe désactivé (déjà utilisé dans des commandes existantes).',
      });
    }

    await pool.query('DELETE FROM modifier_groups WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Groupe supprimé.' });
  } catch (error) {
    next(error);
  }
};

// ═══════════════════════════════════════════════════════════
//  ASSOCIATION PLAT ↔ GROUPES
// ═══════════════════════════════════════════════════════════

// ─── Obtenir les groupes d'un plat ───────────────────────
const getDishModifierGroups = async (req, res, next) => {
  try {
    const { dishId } = req.params;
    const companyId = req.company.id;

    // Vérifier que le plat appartient à l'entreprise
    const [dishes] = await pool.query(
      "SELECT id FROM products WHERE id = ? AND company_id = ? AND product_type = 'dish' AND deleted_at IS NULL",
      [dishId, companyId]
    );
    if (dishes.length === 0) throw new AppError('Plat introuvable.', 404);

    const [groups] = await pool.query(
      `SELECT g.*, pmg.sort_order AS dish_sort_order
       FROM product_modifier_groups pmg
       JOIN modifier_groups g ON g.id = pmg.modifier_group_id
       WHERE pmg.product_id = ?
       ORDER BY pmg.sort_order ASC`,
      [dishId]
    );

    for (const group of groups) {
      const [opts] = await pool.query(
        'SELECT * FROM modifier_options WHERE modifier_group_id = ? AND is_active = 1 ORDER BY sort_order ASC',
        [group.id]
      );
      group.options = opts;
    }

    res.status(200).json({ success: true, data: { groups } });
  } catch (error) {
    next(error);
  }
};

// ─── Associer des groupes à un plat (remplace tout) ──────
const setDishModifierGroups = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { dishId } = req.params;
    const companyId = req.company.id;
    const { group_ids } = req.body; // [{ id: X, sort_order: 0 }, ...]

    // Vérifier que le plat appartient à l'entreprise
    const [dishes] = await connection.query(
      "SELECT id FROM products WHERE id = ? AND company_id = ? AND product_type = 'dish' AND deleted_at IS NULL",
      [dishId, companyId]
    );
    if (dishes.length === 0) throw new AppError('Plat introuvable.', 404);

    // Remplacer les associations
    await connection.query('DELETE FROM product_modifier_groups WHERE product_id = ?', [dishId]);

    if (group_ids && Array.isArray(group_ids) && group_ids.length > 0) {
      for (let i = 0; i < group_ids.length; i++) {
        const entry = group_ids[i];
        const gId = typeof entry === 'object' ? entry.id : entry;
        const sortOrder = typeof entry === 'object' ? (entry.sort_order ?? i) : i;

        // Vérifier que le groupe appartient à l'entreprise
        const [groupCheck] = await connection.query(
          'SELECT id FROM modifier_groups WHERE id = ? AND company_id = ?',
          [gId, companyId]
        );
        if (groupCheck.length === 0) continue;

        await connection.query(
          'INSERT INTO product_modifier_groups (product_id, modifier_group_id, sort_order) VALUES (?, ?, ?)',
          [dishId, gId, sortOrder]
        );
      }
    }

    await connection.commit();
    res.status(200).json({ success: true, message: 'Modificateurs du plat mis à jour.' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

module.exports = {
  getModifierGroups,
  createModifierGroup,
  updateModifierGroup,
  deleteModifierGroup,
  getDishModifierGroups,
  setDishModifierGroups,
};
