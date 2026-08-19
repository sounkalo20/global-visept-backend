// src/routes/notifications.routes.js
const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth.middleware');
const { requireMembership } = require('../middlewares/membership.middleware');
const {
  streamNotifications,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require('../controllers/notifications.controller');

router.use(authenticate);

// Flux SSE temps réel
router.get('/stream', requireMembership(), streamNotifications);

// Obtenir le nombre de non lus
router.get('/count', requireMembership(), getUnreadCount);

// Tout marquer comme lu
router.put('/read-all', requireMembership(), markAllAsRead);

// Marquer une notification comme lue
router.put('/:id/read', requireMembership(), markAsRead);

// Supprimer une notification
router.delete('/:id', requireMembership(), deleteNotification);

// Liste des notifications
router.get('/', requireMembership(), getNotifications);

module.exports = router;
