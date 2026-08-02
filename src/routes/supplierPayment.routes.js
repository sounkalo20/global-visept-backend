// routes/supplierPayment.routes.js (NOUVEAU FICHIER)
const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth.middleware');
const { requireMembership } = require('../middlewares/membership.middleware');
const { requirePermission } = require('../middlewares/permission.middleware');
const {
    getAllPayments,
    addPayment,
    updatePayment,
    deletePayment,
} = require('../controllers/supplierPayment.controller');

router.use(authenticate);

// Paiements globaux
router.get('/', requireMembership(), requirePermission('purchases.view'), getAllPayments);
router.post('/', requireMembership(), requirePermission('purchases.create'), addPayment);
router.put('/:paymentId', requireMembership(), requirePermission('purchases.edit'), updatePayment);
router.delete('/:paymentId', requireMembership(), requirePermission('purchases.edit'), deletePayment);

module.exports = router;