// src/controllers/notifications.controller.js
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const notificationService = require('../services/notification.service');

/**
 * GET /api/notifications/stream
 * Flux Server-Sent Events (SSE) temps réel
 */
const streamNotifications = async (req, res, next) => {
  try {
    const companyId = req.company.id;
    const userId = req.user.id;

    // En-têtes obligatoires pour SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Désactiver buffering Nginx/proxy si présent
    res.flushHeaders();

    // Message initial de connexion
    res.write(`data: ${JSON.stringify({ event: 'connected', message: 'SSE Stream établi', company_id: companyId })}\n\n`);

    // Enregistrer le client
    notificationService.addSseClient(companyId, userId, res);

    // Heartbeat toutes les 25 secondes pour éviter le timeout des proxies
    const heartbeatInterval = setInterval(() => {
      try {
        res.write(`: heartbeat\n\n`);
      } catch (e) {
        clearInterval(heartbeatInterval);
      }
    }, 25000);

    res.on('close', () => {
      clearInterval(heartbeatInterval);
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/notifications
 * Lister les notifications avec filtres et pagination
 */
const getNotifications = async (req, res, next) => {
  try {
    const companyId = req.company.id;
    const userId = req.user.id;
    const { unread_only = 'false', severity, type, page = 1, limit = 20 } = req.query;

    let query = `
      SELECT n.*
      FROM notifications n
      WHERE n.company_id = ?
        AND (n.user_id IS NULL OR n.user_id = ?)
    `;
    const params = [companyId, userId];

    if (unread_only === 'true' || unread_only === true) {
      query += ` AND n.is_read = 0`;
    }

    if (severity && severity !== 'all') {
      query += ` AND n.severity = ?`;
      params.push(severity);
    }

    if (type && type !== 'all') {
      query += ` AND n.type = ?`;
      params.push(type);
    }

    // Compter le total
    const countQuery = `
      SELECT COUNT(*) as total, 
             SUM(CASE WHEN n.is_read = 0 THEN 1 ELSE 0 END) as unread_total
      FROM notifications n
      WHERE n.company_id = ?
        AND (n.user_id IS NULL OR n.user_id = ?)
        ${unread_only === 'true' ? 'AND n.is_read = 0' : ''}
        ${severity && severity !== 'all' ? 'AND n.severity = ?' : ''}
        ${type && type !== 'all' ? 'AND n.type = ?' : ''}
    `;
    const [countRows] = await pool.query(countQuery, params);
    const total = countRows[0]?.total || 0;
    const unreadCount = countRows[0]?.unread_total || 0;

    // Pagination
    query += ` ORDER BY n.created_at DESC LIMIT ? OFFSET ?`;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    const [notifications] = await pool.query(query, params);

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unread_count: unreadCount,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/notifications/count
 * Compter rapidement les non-lus
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const companyId = req.company.id;
    const userId = req.user.id;

    const [rows] = await pool.query(
      `SELECT COUNT(*) as unread_count,
              SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical_count
       FROM notifications
       WHERE company_id = ?
         AND (user_id IS NULL OR user_id = ?)
         AND is_read = 0`,
      [companyId, userId]
    );

    res.status(200).json({
      success: true,
      data: {
        unread_count: rows[0]?.unread_count || 0,
        critical_count: rows[0]?.critical_count || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/notifications/:id/read
 * Marquer une notification comme lue
 */
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.company.id;
    const userId = req.user.id;

    const [notifs] = await pool.query(
      `SELECT id FROM notifications 
       WHERE id = ? AND company_id = ? AND (user_id IS NULL OR user_id = ?)`,
      [id, companyId, userId]
    );

    if (notifs.length === 0) {
      throw new AppError('Notification introuvable.', 404);
    }

    await pool.query(
      `UPDATE notifications 
       SET is_read = 1, read_at = NOW() 
       WHERE id = ?`,
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Notification marquée comme lue.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/notifications/read-all
 * Tout marquer comme lu pour l'entreprise
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const companyId = req.company.id;
    const userId = req.user.id;

    await pool.query(
      `UPDATE notifications 
       SET is_read = 1, read_at = NOW() 
       WHERE company_id = ? 
         AND (user_id IS NULL OR user_id = ?) 
         AND is_read = 0`,
      [companyId, userId]
    );

    res.status(200).json({
      success: true,
      message: 'Toutes les notifications ont été marquées comme lues.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/notifications/:id
 * Supprimer une notification
 */
const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.company.id;
    const userId = req.user.id;

    const [result] = await pool.query(
      `DELETE FROM notifications 
       WHERE id = ? AND company_id = ? AND (user_id IS NULL OR user_id = ?)`,
      [id, companyId, userId]
    );

    if (result.affectedRows === 0) {
      throw new AppError('Notification introuvable.', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Notification supprimée avec succès.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  streamNotifications,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
