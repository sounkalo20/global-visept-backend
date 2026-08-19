const pool = require('../config/db');
const AppError = require('../utils/AppError');
const notificationService = require('../services/notification.service');

// ─── GÉNÉRER UNE RÉFÉRENCE UNIQUE ────────────────────────────────────────────
const generateReference = async (companyId, connection = pool) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `INV-${year}${month}`;
  try {
    const [rows] = await connection.query(
      `SELECT COUNT(*) as cnt FROM inventory_counts WHERE company_id = ? AND reference LIKE ?`,
      [companyId, `${prefix}%`]
    );
    const seq = String((rows[0]?.cnt || 0) + 1).padStart(3, '0');
    return `${prefix}-${seq}`;
  } catch {
    return `${prefix}-${Date.now().toString().slice(-4)}`;
  }
};

// ─── CRÉER UNE SESSION D'INVENTAIRE ─────────────────────────────────────────
exports.createInventorySession = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const companyId = req.company.id;
    const userId = req.user.id;
    const { name, scope_type = 'all_products', scope_ids, notes } = req.body;

    if (!name || name.trim().length === 0) {
      throw new AppError("Le nom de la session d'inventaire est requis.", 400);
    }

    const validScopes = ['all_products', 'by_category', 'manual'];
    if (!validScopes.includes(scope_type)) {
      throw new AppError("Type de portée invalide.", 400);
    }

    // Générer référence unique
    const reference = await generateReference(companyId, connection);

    // Créer la session
    const [sessionResult] = await connection.query(
      `INSERT INTO inventory_counts (company_id, reference, name, scope_type, scope_ids, status, counted_by, notes)
       VALUES (?, ?, ?, ?, ?, 'draft', ?, ?)`,
      [companyId, reference, name.trim(), scope_type, scope_ids ? JSON.stringify(scope_ids) : null, userId, notes || null]
    );
    const sessionId = sessionResult.insertId;

    // ─── Snapshot des stocks (selon portée) ──────────────────────────────────
    let productQuery = `
      SELECT p.id, p.name, p.sku, p.barcode, p.current_stock, p.cost_price, p.image_url,
             c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.company_id = ? AND p.deleted_at IS NULL AND p.manage_stock = 1 AND p.product_type = 'product'
    `;
    const queryParams = [companyId];

    if (scope_type === 'by_category' && scope_ids && scope_ids.length > 0) {
      const placeholders = scope_ids.map(() => '?').join(',');
      productQuery += ` AND p.category_id IN (${placeholders})`;
      queryParams.push(...scope_ids);
    } else if (scope_type === 'manual' && scope_ids && scope_ids.length > 0) {
      const placeholders = scope_ids.map(() => '?').join(',');
      productQuery += ` AND p.id IN (${placeholders})`;
      queryParams.push(...scope_ids);
    }

    productQuery += ' ORDER BY p.name ASC';

    const [products] = await connection.query(productQuery, queryParams);

    if (products.length === 0) {
      throw new AppError("Aucun produit avec gestion de stock trouvé pour cette portée.", 400);
    }

    // Insérer les items (snapshot du stock théorique)
    for (const product of products) {
      await connection.query(
        `INSERT INTO inventory_count_items 
         (inventory_count_id, product_id, theoretical_qty, counted_qty, difference, unit_cost)
         VALUES (?, ?, ?, NULL, NULL, ?)`,
        [sessionId, product.id, product.current_stock, product.cost_price]
      );
    }

    await connection.commit();

    // Récupérer la session créée
    const [sessions] = await connection.query(
      `SELECT ic.*, 
              u1.first_name AS counter_first_name, u1.last_name AS counter_last_name
       FROM inventory_counts ic
       LEFT JOIN users u1 ON ic.counted_by = u1.id
       WHERE ic.id = ?`,
      [sessionId]
    );

    res.status(201).json({
      success: true,
      message: "Session d'inventaire créée avec succès.",
      data: {
        ...sessions[0],
        total_items: products.length
      }
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// ─── LISTE DES SESSIONS ───────────────────────────────────────────────────────
exports.getInventorySessions = async (req, res, next) => {
  try {
    const companyId = req.company.id;
    const { status, page = 1, limit = 20 } = req.query;

    let query = `
      SELECT ic.*,
             u1.first_name AS counter_first_name, u1.last_name AS counter_last_name,
             u2.first_name AS validator_first_name, u2.last_name AS validator_last_name,
             (SELECT COUNT(*) FROM inventory_count_items WHERE inventory_count_id = ic.id) AS item_count,
             (SELECT COUNT(*) FROM inventory_count_items WHERE inventory_count_id = ic.id AND difference != 0 AND difference IS NOT NULL) AS discrepancy_count
      FROM inventory_counts ic
      LEFT JOIN users u1 ON ic.counted_by = u1.id
      LEFT JOIN users u2 ON ic.validated_by = u2.id
      WHERE ic.company_id = ?
    `;
    const params = [companyId];

    if (status) {
      query += ' AND ic.status = ?';
      params.push(status);
    }

    const countQuery = `SELECT COUNT(*) as total FROM inventory_counts WHERE company_id = ?${status ? ' AND status = ?' : ''}`;
    const countParams = status ? [companyId, status] : [companyId];

    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0]?.total || 0;

    query += ' ORDER BY ic.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const [sessions] = await pool.query(query, params);

    res.json({
      success: true,
      data: sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── DÉTAIL D'UNE SESSION ─────────────────────────────────────────────────────
exports.getInventorySession = async (req, res, next) => {
  try {
    const companyId = req.company.id;
    const { id } = req.params;

    const [sessions] = await pool.query(
      `SELECT ic.*,
              u1.first_name AS counter_first_name, u1.last_name AS counter_last_name,
              u2.first_name AS validator_first_name, u2.last_name AS validator_last_name
       FROM inventory_counts ic
       LEFT JOIN users u1 ON ic.counted_by = u1.id
       LEFT JOIN users u2 ON ic.validated_by = u2.id
       WHERE ic.id = ? AND ic.company_id = ?`,
      [id, companyId]
    );

    if (sessions.length === 0) {
      throw new AppError("Session d'inventaire introuvable.", 404);
    }

    const session = sessions[0];

    // Récupérer les items avec info produit
    const [items] = await pool.query(
      `SELECT ici.*,
              p.name AS product_name, p.sku, p.barcode, p.image_url, p.retail_price,
              c.name AS category_name
       FROM inventory_count_items ici
       JOIN products p ON ici.product_id = p.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE ici.inventory_count_id = ?
       ORDER BY p.name ASC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...session,
        items
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── DÉMARRER UNE SESSION (draft → in_progress) ───────────────────────────────
exports.startInventory = async (req, res, next) => {
  try {
    const companyId = req.company.id;
    const { id } = req.params;

    const [sessions] = await pool.query(
      `SELECT id, status FROM inventory_counts WHERE id = ? AND company_id = ?`,
      [id, companyId]
    );

    if (sessions.length === 0) throw new AppError("Session introuvable.", 404);
    if (sessions[0].status !== 'draft') throw new AppError("Seule une session en brouillon peut être démarrée.", 400);

    await pool.query(
      `UPDATE inventory_counts SET status = 'in_progress', started_at = NOW() WHERE id = ?`,
      [id]
    );

    res.json({ success: true, message: "Inventaire démarré." });
  } catch (error) {
    next(error);
  }
};

// ─── METTRE À JOUR UN ITEM (quantité comptée) ─────────────────────────────────
exports.updateItemCount = async (req, res, next) => {
  try {
    const companyId = req.company.id;
    const { id: sessionId, itemId } = req.params;
    const { counted_qty, justification, justification_note } = req.body;

    if (counted_qty === undefined || counted_qty === null || isNaN(parseFloat(counted_qty)) || parseFloat(counted_qty) < 0) {
      throw new AppError("La quantité comptée doit être un nombre positif ou nul.", 400);
    }

    // Vérifier que la session appartient à l'entreprise et est en cours
    const [sessions] = await pool.query(
      `SELECT id, status FROM inventory_counts WHERE id = ? AND company_id = ?`,
      [sessionId, companyId]
    );
    if (sessions.length === 0) throw new AppError("Session introuvable.", 404);
    if (!['in_progress', 'draft'].includes(sessions[0].status)) {
      throw new AppError("Impossible de modifier les items : la session n'est plus en cours.", 400);
    }

    // Récupérer l'item
    const [items] = await pool.query(
      `SELECT ici.*, p.cost_price FROM inventory_count_items ici
       JOIN products p ON ici.product_id = p.id
       WHERE ici.id = ? AND ici.inventory_count_id = ?`,
      [itemId, sessionId]
    );
    if (items.length === 0) throw new AppError("Item introuvable.", 404);

    const item = items[0];
    const countedQty = parseFloat(counted_qty);
    const theoreticalQty = parseFloat(item.theoretical_qty);
    const difference = countedQty - theoreticalQty;
    const discrepancyValue = difference * parseFloat(item.cost_price || 0);

    await pool.query(
      `UPDATE inventory_count_items SET 
         counted_qty = ?, difference = ?, discrepancy_value = ?,
         justification = ?, justification_note = ?, counted_at = NOW()
       WHERE id = ?`,
      [countedQty, difference, discrepancyValue, justification || null, justification_note || null, itemId]
    );

    res.json({
      success: true,
      message: "Comptage enregistré.",
      data: {
        id: itemId,
        counted_qty: countedQty,
        difference,
        discrepancy_value: discrepancyValue
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── COMPLÉTER LE COMPTAGE (in_progress → completed) ─────────────────────────
exports.completeInventory = async (req, res, next) => {
  try {
    const companyId = req.company.id;
    const { id } = req.params;

    const [sessions] = await pool.query(
      `SELECT id, status FROM inventory_counts WHERE id = ? AND company_id = ?`,
      [id, companyId]
    );
    if (sessions.length === 0) throw new AppError("Session introuvable.", 404);
    if (sessions[0].status !== 'in_progress') throw new AppError("La session doit être en cours pour être complétée.", 400);

    // Vérifier qu'au moins un item a été compté
    const [countedItems] = await pool.query(
      `SELECT COUNT(*) as cnt FROM inventory_count_items WHERE inventory_count_id = ? AND counted_qty IS NOT NULL`,
      [id]
    );
    if (!countedItems[0]?.cnt || countedItems[0].cnt === 0) {
      throw new AppError("Veuillez compter au moins un produit avant de terminer.", 400);
    }

    // Calculer les totaux
    const [stats] = await pool.query(
      `SELECT 
         COUNT(*) AS total_products,
         SUM(CASE WHEN difference != 0 AND difference IS NOT NULL THEN 1 ELSE 0 END) AS total_discrepancies,
         COALESCE(SUM(discrepancy_value), 0) AS total_discrepancy_value
       FROM inventory_count_items
       WHERE inventory_count_id = ?`,
      [id]
    );

    await pool.query(
      `UPDATE inventory_counts SET 
         status = 'completed', completed_at = NOW(),
         total_products = ?, total_discrepancies = ?, total_discrepancy_value = ?
       WHERE id = ?`,
      [stats[0].total_products, stats[0].total_discrepancies, stats[0].total_discrepancy_value, id]
    );

    res.json({
      success: true,
      message: "Comptage terminé. En attente de validation.",
      data: stats[0]
    });
  } catch (error) {
    next(error);
  }
};

// ─── REPRENDRE UN INVENTAIRE (completed → in_progress) ───────────────────────
exports.resumeInventory = async (req, res, next) => {
  try {
    const companyId = req.company.id;
    const { id } = req.params;

    const [sessions] = await pool.query(
      `SELECT id, status FROM inventory_counts WHERE id = ? AND company_id = ?`,
      [id, companyId]
    );
    if (sessions.length === 0) throw new AppError("Session introuvable.", 404);
    if (sessions[0].status !== 'completed') throw new AppError("Seule une session complétée peut être reprise.", 400);

    await pool.query(
      `UPDATE inventory_counts SET status = 'in_progress', completed_at = NULL WHERE id = ?`,
      [id]
    );

    res.json({ success: true, message: "Inventaire repris en cours de comptage." });
  } catch (error) {
    next(error);
  }
};

// ─── VALIDER L'INVENTAIRE ET AJUSTER LES STOCKS ───────────────────────────────
exports.validateInventory = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const companyId = req.company.id;
    const userId = req.user.id;
    const { id } = req.params;

    const [sessions] = await connection.query(
      `SELECT id, status FROM inventory_counts WHERE id = ? AND company_id = ?`,
      [id, companyId]
    );
    if (sessions.length === 0) throw new AppError("Session introuvable.", 404);
    if (sessions[0].status !== 'completed') throw new AppError("Seule une session complétée peut être validée.", 400);

    // Récupérer tous les items
    const [items] = await connection.query(
      `SELECT ici.*, p.current_stock, p.cost_price
       FROM inventory_count_items ici
       JOIN products p ON ici.product_id = p.id
       WHERE ici.inventory_count_id = ?`,
      [id]
    );

    // Pour chaque item ayant une quantité comptée et un écart
    for (const item of items) {
      if (item.counted_qty === null) continue; // ignoré si non compté
      const countedQty = parseFloat(item.counted_qty);
      const stockBefore = parseFloat(item.theoretical_qty);
      const diff = parseFloat(item.difference || (countedQty - stockBefore));

      if (diff === 0) continue; // pas d'ajustement nécessaire

      // Mettre à jour le stock du produit
      await connection.query(
        `UPDATE products SET current_stock = ?, updated_at = NOW() WHERE id = ?`,
        [countedQty, item.product_id]
      );

      // Créer un mouvement d'inventaire
      await connection.query(
        `INSERT INTO inventory_movements 
         (company_id, product_id, movement_type, quantity, stock_before, stock_after, 
          reference_type, reference_id, unit_cost, note, performed_by)
         VALUES (?, ?, 'adjustment', ?, ?, ?, 'inventory_count', ?, ?, ?, ?)`,
        [
          companyId,
          item.product_id,
          diff,
          stockBefore,
          countedQty,
          id,
          item.cost_price,
          `[Inventaire ${id}] ${item.justification ? item.justification : 'Ajustement inventaire'}`,
          userId
        ]
      );
    }

    // Recalculer les totaux finals
    const [stats] = await connection.query(
      `SELECT 
         COUNT(*) AS total_products,
         SUM(CASE WHEN difference != 0 AND difference IS NOT NULL THEN 1 ELSE 0 END) AS total_discrepancies,
         COALESCE(SUM(discrepancy_value), 0) AS total_discrepancy_value
       FROM inventory_count_items WHERE inventory_count_id = ?`,
      [id]
    );

    // Marquer comme validé
    await connection.query(
      `UPDATE inventory_counts SET 
         status = 'validated', validated_by = ?,
         total_products = ?, total_discrepancies = ?, total_discrepancy_value = ?
       WHERE id = ?`,
      [userId, stats[0].total_products, stats[0].total_discrepancies, stats[0].total_discrepancy_value, id]
    );

    await connection.commit();

    // 🔔 Notification de validation d'inventaire
    setImmediate(async () => {
      try {
        const [invData] = await pool.query('SELECT reference, name FROM inventory_counts WHERE id = ?', [id]);
        const refName = invData[0] ? `${invData[0].reference} (${invData[0].name})` : `#${id}`;
        const discVal = parseFloat(stats[0]?.total_discrepancy_value || 0);
        const discCount = parseInt(stats[0]?.total_discrepancies || 0);

        await notificationService.createNotification({
          company_id: companyId,
          type: 'inventory_done',
          title: `Inventaire validé : ${refName}`,
          message: `L'inventaire ${refName} a été validé. ${discCount} écart(s) régularisé(s) pour une valeur de ${Math.abs(discVal).toLocaleString('fr-FR')} FCFA.`,
          severity: Math.abs(discVal) > 50000 ? 'warning' : 'info',
          reference_type: 'inventory_count',
          reference_id: id,
          action_url: `/shop/inventory`,
        });
      } catch (err) {
        console.error('Erreur notification validation inventaire:', err.message);
      }
    });

    res.json({
      success: true,
      message: "Inventaire validé. Les stocks ont été ajustés automatiquement.",
      data: {
        total_products: stats[0].total_products,
        total_discrepancies: stats[0].total_discrepancies,
        total_discrepancy_value: stats[0].total_discrepancy_value
      }
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// ─── ANNULER UNE SESSION ───────────────────────────────────────────────────────
exports.cancelInventory = async (req, res, next) => {
  try {
    const companyId = req.company.id;
    const userId = req.user.id;
    const { id } = req.params;

    const [sessions] = await pool.query(
      `SELECT id, status FROM inventory_counts WHERE id = ? AND company_id = ?`,
      [id, companyId]
    );
    if (sessions.length === 0) throw new AppError("Session introuvable.", 404);
    if (sessions[0].status === 'validated') {
      throw new AppError("Un inventaire déjà validé ne peut pas être annulé.", 400);
    }
    if (sessions[0].status === 'canceled') {
      throw new AppError("Cette session est déjà annulée.", 400);
    }

    await pool.query(
      `UPDATE inventory_counts SET status = 'canceled', canceled_at = NOW(), canceled_by = ? WHERE id = ?`,
      [userId, id]
    );

    res.json({ success: true, message: "Session d'inventaire annulée." });
  } catch (error) {
    next(error);
  }
};

// ─── TABLEAU DE BORD / STATISTIQUES ──────────────────────────────────────────
exports.getInventoryDashboard = async (req, res, next) => {
  try {
    const companyId = req.company.id;

    // Inventaires ce mois-ci
    const [monthStats] = await pool.query(
      `SELECT COUNT(*) as count FROM inventory_counts 
       WHERE company_id = ? AND MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())
       AND status NOT IN ('canceled')`,
      [companyId]
    );

    // Dernier inventaire validé
    const [lastValidated] = await pool.query(
      `SELECT reference, name, validated_by, completed_at, total_products, total_discrepancies, total_discrepancy_value
       FROM inventory_counts
       WHERE company_id = ? AND status = 'validated'
       ORDER BY completed_at DESC LIMIT 1`,
      [companyId]
    );

    // Total écarts ce mois
    const [discrepancyStats] = await pool.query(
      `SELECT 
         COALESCE(SUM(total_discrepancies), 0) AS total_discrepancies,
         COALESCE(SUM(total_discrepancy_value), 0) AS total_discrepancy_value
       FROM inventory_counts
       WHERE company_id = ? AND status = 'validated'
       AND MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())`,
      [companyId]
    );

    // Produits les plus souvent en écart
    const [topDiscrepancies] = await pool.query(
      `SELECT p.name AS product_name, p.sku,
              COUNT(*) AS discrepancy_count,
              SUM(ABS(ici.difference)) AS total_difference
       FROM inventory_count_items ici
       JOIN products p ON ici.product_id = p.id
       JOIN inventory_counts ic ON ici.inventory_count_id = ic.id
       WHERE ic.company_id = ? AND ic.status = 'validated'
         AND ici.difference != 0 AND ici.difference IS NOT NULL
       GROUP BY p.id, p.name, p.sku
       ORDER BY discrepancy_count DESC
       LIMIT 5`,
      [companyId]
    );

    // Sessions en cours
    const [activeSessions] = await pool.query(
      `SELECT id, reference, name, status, created_at
       FROM inventory_counts
       WHERE company_id = ? AND status IN ('draft', 'in_progress', 'completed')
       ORDER BY created_at DESC`,
      [companyId]
    );

    res.json({
      success: true,
      data: {
        this_month_count: monthStats[0]?.count || 0,
        last_validated: lastValidated[0] || null,
        discrepancy_stats: discrepancyStats[0] || { total_discrepancies: 0, total_discrepancy_value: 0 },
        top_discrepancies: topDiscrepancies,
        active_sessions: activeSessions
      }
    });
  } catch (error) {
    next(error);
  }
};
