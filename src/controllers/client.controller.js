const pool = require('../config/db');
const AppError = require('../utils/AppError');

// ─── CRÉER UN CLIENT ────────────────────────────────────
const createClient = async (req, res, next) => {
  try {
    const { first_name, last_name, phone, email, address, city, notes } = req.body;
    const companyId = req.company.id;

    // Générer le full_name
    const fullName = [first_name, last_name].filter(Boolean).join(' ').trim();
    if (!fullName) {
      throw new AppError('Le nom complet est requis (first_name ou last_name).', 400);
    }

    // Vérifier l'unicité du téléphone pour cette entreprise
    const [existingPhone] = await pool.query(
      'SELECT id FROM clients WHERE company_id = ? AND phone = ? AND deleted_at IS NULL',
      [companyId, phone]
    );

    if (existingPhone.length > 0) {
      throw new AppError('Un client avec ce numéro de téléphone existe déjà.', 409);
    }

    // Vérifier l'unicité de l'email si fourni
    if (email) {
      const [existingEmail] = await pool.query(
        'SELECT id FROM clients WHERE company_id = ? AND email = ? AND deleted_at IS NULL',
        [companyId, email]
      );

      if (existingEmail.length > 0) {
        throw new AppError('Un client avec cet email existe déjà.', 409);
      }
    }

    // Insérer le client
    const [result] = await pool.query(
      `INSERT INTO clients (
        company_id, first_name, last_name, full_name, phone, email, address, city, notes, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        companyId,
        first_name || null,
        last_name || null,
        fullName,
        phone,
        email || null,
        address || null,
        city || null,
        notes || null,
      ]
    );

    // Récupérer le client créé
    const [clients] = await pool.query(
      'SELECT * FROM clients WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Client créé avec succès.',
      data: {
        client: clients[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── LISTER LES CLIENTS ─────────────────────────────────
const getClients = async (req, res, next) => {
  try {
    const companyId = req.company.id;
    const {
      search,
      is_active,
      has_debt,
      sort_by = 'created_at',
      sort_order = 'DESC',
      page = 1,
      limit = 20,
    } = req.query;

    let query = `
      SELECT c.*,
             (SELECT COUNT(*) FROM sales s WHERE s.client_id = c.id AND s.status = 'completed') as total_purchases_count,
             (SELECT COALESCE(SUM(s.total_amount), 0) FROM sales s WHERE s.client_id = c.id AND s.status = 'completed') as total_purchases_amount,
             (SELECT s.sale_date FROM sales s WHERE s.client_id = c.id AND s.status = 'completed' ORDER BY s.sale_date DESC LIMIT 1) as last_purchase_date
      FROM clients c
      WHERE c.company_id = ? AND c.deleted_at IS NULL
    `;
    const queryParams = [companyId];

    // Recherche par nom, téléphone ou email
    if (search) {
      query += ' AND (c.full_name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)';
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    // Filtre actif/inactif
    if (is_active !== undefined) {
      query += ' AND c.is_active = ?';
      queryParams.push(is_active === 'true' ? 1 : 0);
    }

    // Filtre clients avec dette
    if (has_debt === 'true') {
      query += ' AND c.current_debt > 0';
    }

    // Compter le total
    const countQuery = query.replace(
      /SELECT c\.\*,.*FROM/s,
      'SELECT COUNT(*) as total FROM'
    );
    // Nettoyer la sous-requête pour le count
    const cleanCountQuery = `SELECT COUNT(*) as total FROM clients c WHERE c.company_id = ? AND c.deleted_at IS NULL`;
    const countParams = [companyId];

    if (search) {
      // Ajouter les mêmes filtres pour le count
    }

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM clients c WHERE c.company_id = ? AND c.deleted_at IS NULL
       ${search ? 'AND (c.full_name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)' : ''}
       ${is_active !== undefined ? 'AND c.is_active = ?' : ''}
       ${has_debt === 'true' ? 'AND c.current_debt > 0' : ''}`,
      [
        companyId,
        ...(search ? [`%${search}%`, `%${search}%`, `%${search}%`] : []),
        ...(is_active !== undefined ? [is_active === 'true' ? 1 : 0] : []),
      ]
    );
    const total = countResult[0].total;

    // Tri
    const allowedSortColumns = ['full_name', 'created_at', 'total_purchases', 'current_debt', 'last_purchase_at'];
    const sortColumn = allowedSortColumns.includes(sort_by) ? sort_by : 'created_at';
    const order = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    if (sortColumn === 'total_purchases') {
      query += ` ORDER BY total_purchases_amount ${order}`;
    } else if (sortColumn === 'last_purchase_date') {
      query += ` ORDER BY last_purchase_date ${order}`;
    } else {
      query += ` ORDER BY c.${sortColumn} ${order}`;
    }

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' LIMIT ? OFFSET ?';
    queryParams.push(parseInt(limit), offset);

    const [clients] = await pool.query(query, queryParams);

    // Calculer les statistiques globales
    const [statsResult] = await pool.query(
      `SELECT
         COUNT(*) as total_clients,
         COALESCE(SUM(current_debt), 0) as total_debt,
         COUNT(CASE WHEN current_debt > 0 THEN 1 END) as clients_with_debt
       FROM clients
       WHERE company_id = ? AND deleted_at IS NULL AND is_active = 1`,
      [companyId]
    );

    res.status(200).json({
      success: true,
      data: {
        clients,
        stats: statsResult[0],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── RECHERCHE RAPIDE (POUR POS) ────────────────────────
const searchClients = async (req, res, next) => {
  try {
    const companyId = req.company.id;
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(200).json({
        success: true,
        data: { clients: [] },
      });
    }

    const searchTerm = `%${q}%`;
    const [clients] = await pool.query(
      `SELECT id, full_name, phone, email, current_debt
       FROM clients
       WHERE company_id = ? AND deleted_at IS NULL AND is_active = 1
         AND (full_name LIKE ? OR phone LIKE ? OR email LIKE ?)
       ORDER BY full_name ASC
       LIMIT 10`,
      [companyId, searchTerm, searchTerm, searchTerm]
    );

    res.status(200).json({
      success: true,
      data: { clients },
    });
  } catch (error) {
    next(error);
  }
};

// ─── DÉTAILS D'UN CLIENT ────────────────────────────────
const getClientById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.company.id;

    // Récupérer le client
    const [clients] = await pool.query(
      'SELECT * FROM clients WHERE id = ? AND company_id = ? AND deleted_at IS NULL',
      [id, companyId]
    );

    if (clients.length === 0) {
      throw new AppError('Client introuvable.', 404);
    }

    const client = clients[0];

    // Récupérer les 10 dernières ventes
    const [recentSales] = await pool.query(
      `SELECT id, sale_number, total_amount, payment_status, amount_due, sale_date
       FROM sales
       WHERE client_id = ? AND company_id = ? AND status = 'completed'
       ORDER BY sale_date DESC
       LIMIT 10`,
      [id, companyId]
    );

    // Récupérer les dettes en cours
    const [activeDebts] = await pool.query(
      `SELECT cd.*, s.sale_number
       FROM client_debts cd
       LEFT JOIN sales s ON cd.sale_id = s.id
       WHERE cd.client_id = ? AND cd.company_id = ? AND cd.status IN ('pending', 'partial', 'overdue')
       ORDER BY cd.created_at DESC`,
      [id, companyId]
    );

    // Récupérer les statistiques d'achat
    const [purchaseStats] = await pool.query(
      `SELECT
         COUNT(*) as total_purchases,
         COALESCE(SUM(total_amount), 0) as total_spent,
         COALESCE(AVG(total_amount), 0) as average_purchase,
         MAX(sale_date) as last_purchase
       FROM sales
       WHERE client_id = ? AND company_id = ? AND status = 'completed'`,
      [id, companyId]
    );

    // Top produits achetés
    const [topProducts] = await pool.query(
      `SELECT p.name, p.id, SUM(si.quantity) as total_quantity, SUM(si.total_price) as total_spent
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       JOIN sales s ON si.sale_id = s.id
       WHERE s.client_id = ? AND s.company_id = ? AND s.status = 'completed'
       GROUP BY p.id, p.name
       ORDER BY total_quantity DESC
       LIMIT 5`,
      [id, companyId]
    );

    res.status(200).json({
      success: true,
      data: {
        client: {
          ...client,
          recent_sales: recentSales,
          active_debts: activeDebts,
          purchase_stats: purchaseStats[0],
          top_products: topProducts,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── MODIFIER UN CLIENT ─────────────────────────────────
const updateClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.company.id;
    const { first_name, last_name, phone, email, address, city, notes, is_active } = req.body;

    // Vérifier que le client existe
    const [clients] = await pool.query(
      'SELECT * FROM clients WHERE id = ? AND company_id = ? AND deleted_at IS NULL',
      [id, companyId]
    );

    if (clients.length === 0) {
      throw new AppError('Client introuvable.', 404);
    }

    const client = clients[0];

    // Vérifier l'unicité du téléphone si modifié
    if (phone && phone !== client.phone) {
      const [existingPhone] = await pool.query(
        'SELECT id FROM clients WHERE company_id = ? AND phone = ? AND id != ? AND deleted_at IS NULL',
        [companyId, phone, id]
      );

      if (existingPhone.length > 0) {
        throw new AppError('Un client avec ce numéro de téléphone existe déjà.', 409);
      }
    }

    // Vérifier l'unicité de l'email si modifié
    if (email && email !== client.email) {
      const [existingEmail] = await pool.query(
        'SELECT id FROM clients WHERE company_id = ? AND email = ? AND id != ? AND deleted_at IS NULL',
        [companyId, email, id]
      );

      if (existingEmail.length > 0) {
        throw new AppError('Un client avec cet email existe déjà.', 409);
      }
    }

    // Construire la requête de mise à jour
    const updateFields = [];
    const updateValues = [];

    if (first_name !== undefined) {
      updateFields.push('first_name = ?');
      updateValues.push(first_name);
    }

    if (last_name !== undefined) {
      updateFields.push('last_name = ?');
      updateValues.push(last_name);
    }

    // Recalculer le full_name si first_name ou last_name change
    if (first_name !== undefined || last_name !== undefined) {
      const newFirstName = first_name !== undefined ? first_name : client.first_name;
      const newLastName = last_name !== undefined ? last_name : client.last_name;
      const fullName = [newFirstName, newLastName].filter(Boolean).join(' ').trim();
      updateFields.push('full_name = ?');
      updateValues.push(fullName);
    }

    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }

    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email || null);
    }

    if (address !== undefined) {
      updateFields.push('address = ?');
      updateValues.push(address || null);
    }

    if (city !== undefined) {
      updateFields.push('city = ?');
      updateValues.push(city || null);
    }

    if (notes !== undefined) {
      updateFields.push('notes = ?');
      updateValues.push(notes || null);
    }

    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active);
    }

    if (updateFields.length === 0) {
      throw new AppError('Aucun champ à mettre à jour.', 400);
    }

    updateValues.push(id);

    await pool.query(
      `UPDATE clients SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Récupérer le client mis à jour
    const [updatedClients] = await pool.query(
      'SELECT * FROM clients WHERE id = ?',
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Client mis à jour avec succès.',
      data: {
        client: updatedClients[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── SUPPRIMER UN CLIENT (SOFT DELETE) ──────────────────
const deleteClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.company.id;

    // Vérifier que le client existe
    const [clients] = await pool.query(
      'SELECT * FROM clients WHERE id = ? AND company_id = ? AND deleted_at IS NULL',
      [id, companyId]
    );

    if (clients.length === 0) {
      throw new AppError('Client introuvable.', 404);
    }

    // Vérifier s'il y a des dettes en cours
    const [activeDebts] = await pool.query(
      'SELECT id FROM client_debts WHERE client_id = ? AND status IN ("pending", "partial", "overdue")',
      [id]
    );

    if (activeDebts.length > 0) {
      throw new AppError(
        'Impossible de supprimer ce client car il a des dettes en cours. Veuillez d\'abord régulariser sa situation.',
        400
      );
    }

    // Soft delete
    await pool.query(
      'UPDATE clients SET deleted_at = NOW(), is_active = 0 WHERE id = ? AND company_id = ?',
      [id, companyId]
    );

    res.status(200).json({
      success: true,
      message: 'Client supprimé avec succès.',
    });
  } catch (error) {
    next(error);
  }
};

// ─── STATISTIQUES CLIENTS ───────────────────────────────
const getClientStats = async (req, res, next) => {
  try {
    const companyId = req.company.id;

    const [stats] = await pool.query(
      `SELECT
         COUNT(*) as total_clients,
         COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_clients,
         COALESCE(SUM(current_debt), 0) as total_debt,
         COUNT(CASE WHEN current_debt > 0 THEN 1 END) as clients_with_debt,
         COALESCE(SUM(total_purchases), 0) as total_revenue,
         COALESCE(AVG(total_purchases), 0) as average_per_client
       FROM clients
       WHERE company_id = ? AND deleted_at IS NULL`,
      [companyId]
    );

    // Top clients par achat
    const [topClients] = await pool.query(
      `SELECT id, full_name, phone, total_purchases, total_purchase_count, current_debt
       FROM clients
       WHERE company_id = ? AND deleted_at IS NULL AND is_active = 1
       ORDER BY total_purchases DESC
       LIMIT 5`,
      [companyId]
    );

    // Nouveaux clients ce mois
    const [newClients] = await pool.query(
      `SELECT COUNT(*) as count
       FROM clients
       WHERE company_id = ? AND deleted_at IS NULL
         AND MONTH(created_at) = MONTH(CURDATE())
         AND YEAR(created_at) = YEAR(CURDATE())`,
      [companyId]
    );

    res.status(200).json({
      success: true,
      data: {
        ...stats[0],
        new_clients_this_month: newClients[0].count,
        top_clients: topClients,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── ACTIONS EN MASSE (BULK ACTIONS) ──────────────────
const bulkClientAction = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const companyId = req.company.id;
    const { ids, action, params = {} } = req.body;

    if (!ids || ids.length === 0) {
      throw new AppError('Aucun client sélectionné.', 400);
    }

    const [clients] = await connection.query(
      `SELECT id, full_name, is_active, city, current_debt 
       FROM clients 
       WHERE id IN (?) AND company_id = ? AND deleted_at IS NULL`,
      [ids, companyId]
    );

    const clientMap = new Map(clients.map((c) => [c.id, c]));
    const results = [];
    let successCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    await connection.beginTransaction();

    if (action === 'activate') {
      for (const id of ids) {
        const client = clientMap.get(id);
        if (!client) {
          results.push({ id, status: 'failed', reason: 'Client introuvable ou non autorisé.' });
          failedCount++;
        } else if (client.is_active === 1) {
          results.push({ id, name: client.full_name, status: 'skipped', reason: 'Le client est déjà actif.' });
          skippedCount++;
        } else {
          await connection.query('UPDATE clients SET is_active = 1 WHERE id = ?', [id]);
          results.push({ id, name: client.full_name, status: 'success', message: 'Client activé.' });
          successCount++;
        }
      }
    } else if (action === 'deactivate') {
      for (const id of ids) {
        const client = clientMap.get(id);
        if (!client) {
          results.push({ id, status: 'failed', reason: 'Client introuvable ou non autorisé.' });
          failedCount++;
        } else if (client.is_active === 0) {
          results.push({ id, name: client.full_name, status: 'skipped', reason: 'Le client est déjà inactif.' });
          skippedCount++;
        } else {
          await connection.query('UPDATE clients SET is_active = 0 WHERE id = ?', [id]);
          results.push({ id, name: client.full_name, status: 'success', message: 'Client désactivé.' });
          successCount++;
        }
      }
    } else if (action === 'change_city') {
      const targetCity = params.city ? params.city.trim() : null;
      for (const id of ids) {
        const client = clientMap.get(id);
        if (!client) {
          results.push({ id, status: 'failed', reason: 'Client introuvable ou non autorisé.' });
          failedCount++;
        } else {
          await connection.query('UPDATE clients SET city = ? WHERE id = ?', [targetCity, id]);
          results.push({
            id,
            name: client.full_name,
            status: 'success',
            message: targetCity ? `Ville changée vers "${targetCity}".` : 'Ville réinitialisée.',
          });
          successCount++;
        }
      }
    } else if (action === 'delete') {
      for (const id of ids) {
        const client = clientMap.get(id);
        if (!client) {
          results.push({ id, status: 'failed', reason: 'Client introuvable ou non autorisé.' });
          failedCount++;
          continue;
        }

        // Vérifier les dettes
        const [debts] = await connection.query(
          'SELECT id FROM client_debts WHERE client_id = ? AND status IN ("pending", "partial", "overdue") LIMIT 1',
          [id]
        );

        if (debts.length > 0 || parseFloat(client.current_debt || 0) > 0) {
          results.push({
            id,
            name: client.full_name,
            status: 'skipped',
            reason: 'Dettes en cours non soldées. Régularisez d\'abord sa situation financière.',
          });
          skippedCount++;
          continue;
        }

        // Soft delete
        await connection.query(
          'UPDATE clients SET deleted_at = NOW(), is_active = 0 WHERE id = ?',
          [id]
        );
        results.push({ id, name: client.full_name, status: 'success', message: 'Client supprimé.' });
        successCount++;
      }
    }

    await connection.commit();

    res.status(200).json({
      success: true,
      message: `${successCount} client(s) traité(s) avec succès.`,
      data: {
        total_requested: ids.length,
        success_count: successCount,
        skipped_count: skippedCount,
        failed_count: failedCount,
        results,
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
  createClient,
  getClients,
  searchClients,
  getClientById,
  updateClient,
  deleteClient,
  getClientStats,
  bulkClientAction,
};