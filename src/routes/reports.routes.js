// src/routes/reports.routes.js
const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth.middleware');
const { requireMembership } = require('../middlewares/membership.middleware');
const { requirePermission } = require('../middlewares/permission.middleware');
const { requireFeature } = require('../middlewares/subscription.middleware');
const {
  getStockValuation,
  getStockMovementsReport,
  getStockRotationReport,
  compareInventoryCounts,
  exportStockValuation,
} = require('../controllers/reports.controller');

router.use(authenticate);

// Feature gate: 'reports' ou 'advanced_reports'
// RBAC: 'inventory.view'
router.get(
  '/stock-valuation',
  requireMembership(),
  requireFeature('reports'),
  requirePermission('inventory.view'),
  getStockValuation
);

router.get(
  '/stock-valuation/export',
  requireMembership(),
  requireFeature('reports'),
  requirePermission('inventory.view'),
  exportStockValuation
);

router.get(
  '/stock-movements',
  requireMembership(),
  requireFeature('reports'),
  requirePermission('inventory.view'),
  getStockMovementsReport
);

router.get(
  '/stock-rotation',
  requireMembership(),
  requireFeature('reports'),
  requirePermission('inventory.view'),
  getStockRotationReport
);

router.get(
  '/inventory-comparison',
  requireMembership(),
  requireFeature('reports'),
  requirePermission('inventory.view'),
  compareInventoryCounts
);

module.exports = router;
