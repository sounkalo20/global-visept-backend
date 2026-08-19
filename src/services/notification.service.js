// src/services/notification.service.js
const pool = require('../config/db');

// Map des clients connectés en Server-Sent Events (SSE)
// Structure: companyId -> Set of response objects (res)
const sseClients = new Map();

/**
 * Enregistrer un client SSE pour une entreprise
 */
const addSseClient = (companyId, userId, res) => {
  const compId = String(companyId);
  if (!sseClients.has(compId)) {
    sseClients.set(compId, new Set());
  }

  const client = { userId: String(userId), res };
  sseClients.get(compId).add(client);

  // Nettoyage à la déconnexion
  res.on('close', () => {
    removeSseClient(companyId, client);
  });
};

/**
 * Supprimer un client SSE
 */
const removeSseClient = (companyId, client) => {
  const compId = String(companyId);
  if (sseClients.has(compId)) {
    const clients = sseClients.get(compId);
    clients.delete(client);
    if (clients.size === 0) {
      sseClients.delete(compId);
    }
  }
};

/**
 * Diffuser un événement SSE aux clients d'une entreprise
 */
const broadcastToCompany = (companyId, targetUserId, data) => {
  const compId = String(companyId);
  if (!sseClients.has(compId)) return;

  const clients = sseClients.get(compId);
  const payload = `data: ${JSON.stringify(data)}\n\n`;

  for (const client of clients) {
    // Si targetUserId est spécifié, on n'envoie qu'à cet utilisateur
    if (!targetUserId || client.userId === String(targetUserId)) {
      try {
        client.res.write(payload);
      } catch (err) {
        console.error('Erreur lors de l\'envoi SSE:', err.message);
      }
    }
  }
};

/**
 * Créer et diffuser une notification
 */
const createNotification = async ({
  company_id,
  user_id = null,
  type,
  title,
  message,
  severity = 'info', // 'info' | 'warning' | 'critical'
  reference_type = null,
  reference_id = null,
  action_url = null,
}) => {
  try {
    if (!company_id || !title || !message) {
      console.warn('⚠️ Tentative de création de notification avec paramètres manquants');
      return null;
    }

    const [result] = await pool.query(
      `INSERT INTO notifications 
        (company_id, user_id, type, title, message, severity, reference_type, reference_id, action_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [company_id, user_id || null, type, title, message, severity, reference_type, reference_id, action_url]
    );

    const notificationId = result.insertId;

    const newNotification = {
      id: notificationId,
      company_id,
      user_id,
      type,
      title,
      message,
      severity,
      is_read: 0,
      reference_type,
      reference_id,
      action_url,
      created_at: new Date().toISOString(),
    };

    // Diffuser immédiatement en temps réel via SSE
    broadcastToCompany(company_id, user_id, {
      event: 'new_notification',
      notification: newNotification,
    });

    return newNotification;
  } catch (error) {
    console.error('❌ Erreur lors de la création de la notification:', error);
    return null;
  }
};

module.exports = {
  addSseClient,
  removeSseClient,
  broadcastToCompany,
  createNotification,
};
