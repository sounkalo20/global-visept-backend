// src/routes/supplierCredit.routes.js
const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth.middleware');
const { requireMembership } = require('../middlewares/membership.middleware');
const { requirePermission } = require('../middlewares/permission.middleware');
const { requireFeature } = require('../middlewares/subscription.middleware');
const {
  createSupplierCredit,
  getSupplierCredits,
  getSupplierCreditById,
  applySupplierCredit,
  cancelSupplierCredit,
} = require('../controllers/supplierCredit.controller');

router.use(authenticate);

// Feature gate: 'suppliers'
// RBAC: 'suppliers.view' pour lire, 'suppliers.edit' ou 'supplier_credits.manage' pour modifier
router.post(
  '/:id/apply',
  requireMembership(),
  requireFeature('suppliers'),
  requirePermission('suppliers.edit'),
  applySupplierCredit
);

router.put(
  '/:id/cancel',
  requireMembership(),
  requireFeature('suppliers'),
  requirePermission('suppliers.edit'),
  cancelSupplierCredit
);

router.get(
  '/:id',
  requireMembership(),
  requireFeature('suppliers'),
  requirePermission('suppliers.view'),
  getSupplierCreditById
);

router.post(
  '/',
  requireMembership(),
  requireFeature('suppliers'),
  requirePermission('suppliers.create'),
  createSupplierCredit
);

router.get(
  '/',
  requireMembership(),
  requireFeature('suppliers'),
  requirePermission('suppliers.view'),
  getSupplierCredits
);

module.exports = router;
