// routes/supplier.routes.js
const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth.middleware');
const { requireMembership } = require('../middlewares/membership.middleware');
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
    requireMembership(['owner', 'manager']),
    createSupplier
);

router.get(
    '/',
    requireMembership(),
    getSuppliers
);

router.get(
    '/:id',
    requireMembership(),
    getSupplierById
);

router.put(
    '/:id',
    requireMembership(['owner', 'manager']),
    updateSupplier
);

router.delete(
    '/:id',
    requireMembership(['owner']),
    deleteSupplier
);

router.put(
    '/:id/toggle-status',
    requireMembership(['owner', 'manager']),
    toggleSupplierStatus
);

module.exports = router;