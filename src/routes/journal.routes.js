// src/routes/journal.routes.js
const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth.middleware');
const { requireMembership } = require('../middlewares/membership.middleware');
const { requirePermission } = require('../middlewares/permission.middleware');
const { requireFeature } = require('../middlewares/subscription.middleware');
const {
  getJournal,
  getJournalSummary,
  exportJournal,
} = require('../controllers/journal.controller');

router.use(authenticate);

// Feature gate: 'journal'
// RBAC permission: 'journal.view'
router.get(
  '/summary',
  requireMembership(),
  requireFeature('journal'),
  requirePermission('journal.view'),
  getJournalSummary
);

router.get(
  '/export',
  requireMembership(),
  requireFeature('journal'),
  requirePermission('journal.view'),
  exportJournal
);

router.get(
  '/',
  requireMembership(),
  requireFeature('journal'),
  requirePermission('journal.view'),
  getJournal
);

module.exports = router;
