const express = require('express');
const router = express.Router();
const {
  createReturn,
  getReturns,
  getReturnById
} = require('../controllers/return.controller');
const authenticate = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { requireMembership } = require('../middlewares/membership.middleware');
const { requirePermission } = require('../middlewares/permission.middleware');
const { subscriptionContext, requireFeature } = require('../middlewares/subscription.middleware');
const { createReturnSchema } = require('../validators/return.validator');

router.use(authenticate);

// POST /api/returns - Créer un retour
router.post(
  '/',
  validate(createReturnSchema),
  requireMembership(),
  requirePermission('sales.return'),
  subscriptionContext,
  requireFeature('module_returns'),
  createReturn
);

// GET /api/returns - Lister les retours
router.get(
  '/',
  requireMembership(),
  requirePermission('sales.view'),
  subscriptionContext,
  requireFeature('module_returns'),
  getReturns
);

// GET /api/returns/:id - Détails d'un retour
router.get(
  '/:id',
  requireMembership(),
  requirePermission('sales.view'),
  subscriptionContext,
  requireFeature('module_returns'),
  getReturnById
);

module.exports = router;
