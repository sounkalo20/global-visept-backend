const express = require('express');
const router = express.Router();
const { getStockAnomalies, resolveStockAnomaly } = require('../controllers/stockAnomaly.controller');
const authenticate = require('../middlewares/auth.middleware');
const { requireMembership } = require('../middlewares/membership.middleware');
const { requirePermission } = require('../middlewares/permission.middleware');

router.use(authenticate);

// GET /api/stock-anomalies
router.get(
  '/',
  requireMembership(),
  requirePermission('inventory.view'),
  getStockAnomalies
);

// PUT /api/stock-anomalies/:id/resolve
router.put(
  '/:id/resolve',
  requireMembership(),
  requirePermission('inventory.adjust'),
  resolveStockAnomaly
);

module.exports = router;
