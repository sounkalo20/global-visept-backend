// src/routes/stockPrediction.routes.js
const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth.middleware');
const { requireMembership } = require('../middlewares/membership.middleware');
const { requirePermission } = require('../middlewares/permission.middleware');
const { requireFeature } = require('../middlewares/subscription.middleware');
const { getStockPredictions } = require('../controllers/stockPrediction.controller');

router.use(authenticate);

// Feature gate: 'stock_prediction'
// RBAC: 'inventory.view'
router.get(
  '/',
  requireMembership(),
  requireFeature('stock_prediction'),
  requirePermission('inventory.view'),
  getStockPredictions
);

module.exports = router;
