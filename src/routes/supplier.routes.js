// routes/supplier.routes.js
const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth.middleware');
const { requireMembership } = require('../middlewares/membership.middleware');
const { requirePermission } = require('../middlewares/permission.middleware');
const validate = require('../middlewares/validate.middleware');
const {
    createSupplier,
    getSuppliers,
    getSupplierById,
    updateSupplier,
    deleteSupplier,
    toggleSupplierStatus,
} = require('../controllers/supplier.controller');

// Toutes les routes nécessitent authentification + appartenance à l'entreprise
router.use(authenticate);

// ─── CRUD Fournisseurs ────────────────────────────────
router.post(
    '/',
    requireMembership(),
    requirePermission('suppliers.create'),
    createSupplier
);

router.get(
    '/',
    requireMembership(),
    requirePermission('suppliers.view'),
    getSuppliers
);

router.get(
    '/:id',
    requireMembership(),
    requirePermission('suppliers.view'),
    getSupplierById
);

router.put(
    '/:id',
    requireMembership(),
    requirePermission('suppliers.edit'),
    updateSupplier
);

router.delete(
    '/:id',
    requireMembership(),
    requirePermission('suppliers.delete'),
    deleteSupplier
);

router.put(
    '/:id/toggle-status',
    requireMembership(),
    requirePermission('suppliers.edit'),
    toggleSupplierStatus
);

module.exports = router;