// controllers/restaurant/table.controller.js
const pool = require('../../config/db');
const AppError = require('../../utils/AppError');

// ─── GÉNÉRER UN NUMÉRO DE VENTE UNIQUE ──────────────────
const generateSaleNumber = async (connection, companyId) => {
  const date = new Date();
  const prefix = `RES-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;

  const [rows] = await connection.query(
    `SELECT sale_number FROM sales
     WHERE company_id = ? AND sale_number LIKE ?
     ORDER BY id DESC LIMIT 1`,
    [companyId, `${prefix}%`]
  );

  let sequence = 1;
  if (rows.length > 0) {
    const lastSeq = parseInt(rows[0].sale_number.split('-').pop());
    sequence = lastSeq + 1;
  }

  return `${prefix}-${String(sequence).padStart(5, '0')}`;
};

// ─── PLAN DE SALLE & STATUTS DES TABLES ───────────────────
const getFloorPlan = async (req, res, next) => {
  try {
    const companyId = req.company.id;
    const { space_id, search } = req.query;

    let whereClause = 'WHERE t.company_id = ? AND t.is_active = 1';
    const queryParams = [companyId];

    if (space_id) {
      whereClause += ' AND t.space_id = ?';
      queryParams.push(space_id);
    }
    if (search) {
      whereClause += ' AND (t.table_number LIKE ? OR t.table_name LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    const query = `
      SELECT t.*,
             s.name AS space_name,
             ts.id AS session_id, ts.opened_at, ts.number_of_guests, ts.staff_id,
             CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) AS staff_name,
             sa.id AS sale_id, sa.sale_number, sa.subtotal, sa.total_amount, sa.status AS sale_status
      FROM restaurant_tables t
      LEFT JOIN restaurant_spaces s ON t.space_id = s.id
      LEFT JOIN table_sessions ts ON ts.table_id = t.id AND ts.status = 'open'
      LEFT JOIN users u ON ts.staff_id = u.id
      LEFT JOIN sales sa ON sa.table_session_id = ts.id AND sa.status = 'pending'
      ${whereClause}
      ORDER BY t.space_id ASC, t.table_number ASC, t.table_name ASC
    `;

    const [tables] = await pool.query(query, queryParams);

    // Calcul de la durée en minutes et enrichissement des items de commande
    const now = new Date();
    for (const table of tables) {
      if (table.opened_at) {
        const openedAt = new Date(table.opened_at);
        table.duration_minutes = Math.floor((now - openedAt) / (1000 * 60));
      } else {
        table.duration_minutes = 0;
      }

      if (table.sale_id) {
        const [items] = await pool.query(
          `SELECT si.*, p.name AS product_name, p.image_url
           FROM sale_items si
           JOIN products p ON si.product_id = p.id
           WHERE si.sale_id = ?`,
          [table.sale_id]
        );
        table.items_count = items.length;
        table.items = items;
      } else {
        table.items_count = 0;
        table.items = [];
      }
    }

    // Statistiques globales
    const [stats] = await pool.query(
      `SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
         SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied,
         SUM(CASE WHEN status = 'bill_requested' THEN 1 ELSE 0 END) as bill_requested,
         SUM(CASE WHEN status = 'needs_cleaning' THEN 1 ELSE 0 END) as needs_cleaning,
         SUM(CASE WHEN status = 'reserved' THEN 1 ELSE 0 END) as reserved,
         SUM(CASE WHEN status = 'out_of_service' THEN 1 ELSE 0 END) as out_of_service
       FROM restaurant_tables
       WHERE company_id = ? AND is_active = 1`,
      [companyId]
    );

    res.status(200).json({
      success: true,
      data: {
        tables,
        stats: stats[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── CRÉER UNE TABLE ──────────────────────────────────────
const createTable = async (req, res, next) => {
  try {
    const { table_number, table_name, capacity, space_id, shape, position_x, position_y, width, height } = req.body;
    const companyId = req.company.id;

    if (!table_number && !table_name) {
      throw new AppError('Le numéro ou nom de la table est requis.', 400);
    }

    const [existing] = await pool.query(
      'SELECT id FROM restaurant_tables WHERE company_id = ? AND (table_number = ? OR table_name = ?) AND is_active = 1',
      [companyId, table_number || '', table_name || '']
    );

    if (existing.length > 0) {
      throw new AppError('Une table avec ce numéro ou nom existe déjà.', 409);
    }

    const [result] = await pool.query(
      `INSERT INTO restaurant_tables (
        company_id, space_id, table_number, table_name, capacity, shape,
        position_x, position_y, width, height, status, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'available', 1)`,
      [
        companyId,
        space_id || null,
        table_number || null,
        table_name || null,
        parseInt(capacity) || 4,
        shape || 'square',
        parseInt(position_x) || 0,
        parseInt(position_y) || 0,
        parseInt(width) || 80,
        parseInt(height) || 80,
      ]
    );

    const [tables] = await pool.query('SELECT * FROM restaurant_tables WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Table créée avec succès.',
      data: { table: tables[0] },
    });
  } catch (error) {
    next(error);
  }
};

// ─── MODIFIER UNE TABLE ───────────────────────────────────
const updateTable = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.company.id;
    const { table_number, table_name, capacity, space_id, shape, position_x, position_y, width, height, is_active } = req.body;

    const [existing] = await pool.query(
      'SELECT * FROM restaurant_tables WHERE id = ? AND company_id = ?',
      [id, companyId]
    );

    if (existing.length === 0) throw new AppError('Table introuvable.', 404);

    const updates = [];
    const values = [];

    if (table_number !== undefined) { updates.push('table_number = ?'); values.push(table_number || null); }
    if (table_name !== undefined) { updates.push('table_name = ?'); values.push(table_name || null); }
    if (capacity !== undefined) { updates.push('capacity = ?'); values.push(parseInt(capacity) || 4); }
    if (space_id !== undefined) { updates.push('space_id = ?'); values.push(space_id || null); }
    if (shape !== undefined) { updates.push('shape = ?'); values.push(shape); }
    if (position_x !== undefined) { updates.push('position_x = ?'); values.push(parseInt(position_x) || 0); }
    if (position_y !== undefined) { updates.push('position_y = ?'); values.push(parseInt(position_y) || 0); }
    if (width !== undefined) { updates.push('width = ?'); values.push(parseInt(width) || 80); }
    if (height !== undefined) { updates.push('height = ?'); values.push(parseInt(height) || 80); }
    if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active ? 1 : 0); }

    if (updates.length > 0) {
      values.push(id);
      await pool.query(`UPDATE restaurant_tables SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    const [updated] = await pool.query('SELECT * FROM restaurant_tables WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Table mise à jour.',
      data: { table: updated[0] },
    });
  } catch (error) {
    next(error);
  }
};

// ─── POSITIONS EN MASSE (Drag & Drop) ─────────────────────
const updatePositions = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const companyId = req.company.id;
    const { positions } = req.body; // [{ id: 1, position_x: 100, position_y: 200 }, ...]

    if (positions && Array.isArray(positions)) {
      for (const pos of positions) {
        await connection.query(
          `UPDATE restaurant_tables
           SET position_x = ?, position_y = ?
           WHERE id = ? AND company_id = ?`,
          [parseInt(pos.position_x) || 0, parseInt(pos.position_y) || 0, pos.id, companyId]
        );
      }
    }

    await connection.commit();
    res.status(200).json({ success: true, message: 'Positions mises à jour.' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// ─── OUVRIR UNE SESSION DE TABLE ──────────────────────────
const openSession = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { table_id, number_of_guests, staff_id } = req.body;
    const companyId = req.company.id;
    const userId = req.user.id;
    const assignedStaffId = staff_id || userId;

    if (!table_id) {
      throw new AppError('L\'ID de la table (table_id) est requis.', 400);
    }

    // Verrouiller la table pour éviter l'ouverture simultanée par 2 serveurs
    const [tables] = await connection.query(
      'SELECT * FROM restaurant_tables WHERE id = ? AND company_id = ? FOR UPDATE',
      [table_id, companyId]
    );

    if (tables.length === 0) throw new AppError('Table introuvable.', 404);

    const table = tables[0];

    if (['occupied', 'bill_requested'].includes(table.status)) {
      throw new AppError(
        `La table ${table.table_number || table.table_name} est déjà occupée ou en attente d'encaissement.`,
        409
      );
    }

    // Vérifier la capacité d'accueil de la table
    if (table.capacity && parseInt(number_of_guests) > table.capacity) {
      throw new AppError(
        `Cette table a une capacité maximale de ${table.capacity} place(s) (${number_of_guests} couvert(s) demandés).`,
        400
      );
    }

    // Vérifier si une session open existe déjà
    const [existingSessions] = await connection.query(
      'SELECT id FROM table_sessions WHERE table_id = ? AND status = \'open\'',
      [table_id]
    );

    if (existingSessions.length > 0) {
      throw new AppError('Une session est déjà ouverte sur cette table.', 409);
    }

    // 1. Créer la session de table avec le serveur assigné
    const [sessionResult] = await connection.query(
      `INSERT INTO table_sessions (company_id, table_id, opened_at, number_of_guests, staff_id, status)
       VALUES (?, ?, NOW(), ?, ?, 'open')`,
      [companyId, table_id, parseInt(number_of_guests) || 1, assignedStaffId]
    );

    const sessionId = sessionResult.insertId;

    // 2. Mettre la table en 'occupied'
    await connection.query(
      "UPDATE restaurant_tables SET status = 'occupied' WHERE id = ?",
      [table_id]
    );

    // 3. Créer une vente pending associée
    const saleNumber = await generateSaleNumber(connection, companyId);
    const [saleResult] = await connection.query(
      `INSERT INTO sales (
        company_id, sale_number, subtotal, discount_amount, total_amount,
        payment_status, amount_paid, amount_due, status, table_id, table_session_id, seller_id, sale_date
      ) VALUES (?, ?, 0, 0, 0, 'unpaid', 0, 0, 'pending', ?, ?, ?, NOW())`,
      [companyId, saleNumber, table_id, sessionId, userId]
    );

    // 4. Log de session
    await connection.query(
      `INSERT INTO table_session_logs (company_id, table_session_id, action_type, source_table_id, staff_id, details)
       VALUES (?, ?, 'opened', ?, ?, ?)`,
      [companyId, sessionId, table_id, userId, JSON.stringify({ number_of_guests, sale_id: saleResult.insertId })]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Table ouverte avec succès.',
      data: {
        session_id: sessionId,
        sale_id: saleResult.insertId,
        sale_number: saleNumber,
        table_id,
      },
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// ─── CHANGER LE STATUT D'UNE TABLE ───────────────────────
const updateStatus = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { status } = req.body; // 'bill_requested', 'needs_cleaning', 'available', 'reserved', 'out_of_service'
    const companyId = req.company.id;
    const userId = req.user.id;

    const allowedStatus = ['available', 'occupied', 'bill_requested', 'needs_cleaning', 'reserved', 'out_of_service'];
    if (!allowedStatus.includes(status)) {
      throw new AppError('Statut invalide.', 400);
    }

    const [tables] = await connection.query(
      'SELECT * FROM restaurant_tables WHERE id = ? AND company_id = ? FOR UPDATE',
      [id, companyId]
    );
    if (tables.length === 0) throw new AppError('Table introuvable.', 404);

    await connection.query(
      'UPDATE restaurant_tables SET status = ? WHERE id = ?',
      [status, id]
    );

    // Si on passe la table en 'available', fermer la session active si elle existe
    if (status === 'available') {
      const [sessions] = await connection.query(
        'SELECT id FROM table_sessions WHERE table_id = ? AND status = \'open\'',
        [id]
      );
      if (sessions.length > 0) {
        await connection.query(
          'UPDATE table_sessions SET status = \'closed\', closed_at = NOW() WHERE id = ?',
          [sessions[0].id]
        );
      }
    }

    // Log de statut
    const [openSession] = await connection.query(
      'SELECT id FROM table_sessions WHERE table_id = ? AND status = \'open\'',
      [id]
    );

    if (openSession.length > 0) {
      await connection.query(
        `INSERT INTO table_session_logs (company_id, table_session_id, action_type, source_table_id, staff_id, details)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [companyId, openSession[0].id, status === 'bill_requested' ? 'bill_requested' : status === 'available' ? 'cleaned' : 'reserved', id, userId, JSON.stringify({ new_status: status })]
      );
    }

    await connection.commit();

    res.status(200).json({
      success: true,
      message: `Statut de la table mis à jour : ${status}.`,
      data: { status },
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// ─── TRANSFERT DE TABLE ───────────────────────────────────
const transferTable = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { session_id, target_table_id } = req.body;
    const companyId = req.company.id;
    const userId = req.user.id;

    // 1. Récupérer la session d'origine
    const [sessions] = await connection.query(
      'SELECT * FROM table_sessions WHERE id = ? AND company_id = ? AND status = \'open\' FOR UPDATE',
      [session_id, companyId]
    );

    if (sessions.length === 0) throw new AppError('Session introuvable ou déjà fermée.', 404);
    const session = sessions[0];
    const sourceTableId = session.table_id;

    if (sourceTableId === target_table_id) {
      throw new AppError('La table de destination est identique à la table actuelle.', 400);
    }

    // 2. Verrouiller la table de destination
    const [targetTables] = await connection.query(
      'SELECT * FROM restaurant_tables WHERE id = ? AND company_id = ? FOR UPDATE',
      [target_table_id, companyId]
    );

    if (targetTables.length === 0) throw new AppError('Table de destination introuvable.', 404);
    const targetTable = targetTables[0];

    if (targetTable.status !== 'available') {
      throw new AppError(`La table ${targetTable.table_number || targetTable.table_name} n'est pas libre.`, 409);
    }

    // 3. Déplacer la session et la vente associée
    await connection.query(
      'UPDATE table_sessions SET table_id = ? WHERE id = ?',
      [target_table_id, session_id]
    );

    await connection.query(
      'UPDATE sales SET table_id = ? WHERE table_session_id = ? AND status = \'pending\'',
      [target_table_id, session_id]
    );

    // 4. Mettre à jour l'état des tables
    const [sourceTableRows] = await connection.query('SELECT status FROM restaurant_tables WHERE id = ?', [sourceTableId]);
    const currentStatus = sourceTableRows[0]?.status || 'occupied';

    await connection.query('UPDATE restaurant_tables SET status = \'available\' WHERE id = ?', [sourceTableId]);
    await connection.query('UPDATE restaurant_tables SET status = ? WHERE id = ?', [currentStatus, target_table_id]);

    // 5. Log de transfert
    await connection.query(
      `INSERT INTO table_session_logs (company_id, table_session_id, action_type, source_table_id, target_table_id, staff_id, details)
       VALUES (?, ?, 'transferred', ?, ?, ?, ?)`,
      [companyId, session_id, sourceTableId, target_table_id, userId, JSON.stringify({ from: sourceTableId, to: target_table_id })]
    );

    await connection.commit();

    res.status(200).json({
      success: true,
      message: 'Table transférée avec succès.',
      data: {
        session_id,
        source_table_id: sourceTableId,
        target_table_id,
      },
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// ─── FUSION DE TABLES ─────────────────────────────────────
const mergeTables = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { primary_table_id, secondary_table_id } = req.body;
    const companyId = req.company.id;
    const userId = req.user.id;

    if (primary_table_id === secondary_table_id) {
      throw new AppError('Impossible de fusionner une table avec elle-même.', 400);
    }

    // Récupérer les sessions ouvertes des deux tables
    const [primarySessions] = await connection.query(
      'SELECT * FROM table_sessions WHERE table_id = ? AND status = \'open\' AND company_id = ? FOR UPDATE',
      [primary_table_id, companyId]
    );
    const [secondarySessions] = await connection.query(
      'SELECT * FROM table_sessions WHERE table_id = ? AND status = \'open\' AND company_id = ? FOR UPDATE',
      [secondary_table_id, companyId]
    );

    if (primarySessions.length === 0) throw new AppError('La table principale n\'a pas de session ouverte.', 404);
    if (secondarySessions.length === 0) throw new AppError('La table secondaire n\'a pas de session ouverte.', 404);

    const primarySession = primarySessions[0];
    const secondarySession = secondarySessions[0];

    // Récupérer les ventes pending
    const [primarySales] = await connection.query(
      'SELECT * FROM sales WHERE table_session_id = ? AND status = \'pending\' FOR UPDATE',
      [primarySession.id]
    );
    const [secondarySales] = await connection.query(
      'SELECT * FROM sales WHERE table_session_id = ? AND status = \'pending\' FOR UPDATE',
      [secondarySession.id]
    );

    if (primarySales.length === 0 || secondarySales.length === 0) {
      throw new AppError('Impossible de fusionner : l\'une des tables n\'a pas de commande en cours.', 400);
    }

    const primarySale = primarySales[0];
    const secondarySale = secondarySales[0];

    // 1. Déplacer tous les sale_items de la vente secondaire vers la vente principale
    await connection.query(
      'UPDATE sale_items SET sale_id = ? WHERE sale_id = ?',
      [primarySale.id, secondarySale.id]
    );

    // 2. Recalculer le sous-total et le total de la vente principale
    const [subtotalRow] = await connection.query(
      'SELECT COALESCE(SUM(total_price), 0) AS new_subtotal FROM sale_items WHERE sale_id = ?',
      [primarySale.id]
    );
    const newSubtotal = parseFloat(subtotalRow[0].new_subtotal);

    let globalDiscount = 0;
    if (primarySale.discount_type === 'percentage' && primarySale.discount_value) {
      globalDiscount = newSubtotal * (parseFloat(primarySale.discount_value) / 100);
    } else if (primarySale.discount_type === 'fixed' && primarySale.discount_value) {
      globalDiscount = parseFloat(primarySale.discount_value);
    }

    const newTotal = Math.max(0, newSubtotal - globalDiscount);

    await connection.query(
      `UPDATE sales
       SET subtotal = ?, discount_amount = ?, total_amount = ?
       WHERE id = ?`,
      [newSubtotal, globalDiscount, newTotal, primarySale.id]
    );

    // 3. Annuler proprement la vente secondaire
    await connection.query(
      `UPDATE sales
       SET status = 'canceled', cancel_reason = ?
       WHERE id = ?`,
      [`Fusionnée avec la table principale (Vente #${primarySale.sale_number})`, secondarySale.id]
    );

    // 4. Fermer la session secondaire
    await connection.query(
      'UPDATE table_sessions SET status = \'closed\', closed_at = NOW() WHERE id = ?',
      [secondarySession.id]
    );

    // 5. Passer la table secondaire en 'available'
    await connection.query(
      'UPDATE restaurant_tables SET status = \'available\' WHERE id = ?',
      [secondary_table_id]
    );

    // 6. Log de fusion
    await connection.query(
      `INSERT INTO table_session_logs (company_id, table_session_id, action_type, source_table_id, target_table_id, staff_id, details)
       VALUES (?, ?, 'merged', ?, ?, ?, ?)`,
      [companyId, primarySession.id, secondary_table_id, primary_table_id, userId, JSON.stringify({
        merged_sale_id: secondarySale.id,
        merged_session_id: secondarySession.id,
      })]
    );

    await connection.commit();

    res.status(200).json({
      success: true,
      message: 'Tables fusionnées avec succès.',
      data: {
        primary_table_id,
        secondary_table_id,
        primary_sale_id: primarySale.id,
        new_total: newTotal,
      },
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

module.exports = {
  getFloorPlan,
  createTable,
  updateTable,
  updatePositions,
  openSession,
  updateStatus,
  transferTable,
  mergeTables,
};
