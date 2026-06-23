// routes/supplierPayment.routes.js (NOUVEAU FICHIER)
const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth.middleware');
const { requireMembership } = require('../middlewares/membership.middleware');
const {
    getAllPayments,
    addPayment,
    updatePayment,
    deletePayment,
} = require('../controllers/supplierPayment.controller');

router.use(authenticate);

// Paiements globaux
router.get('/', requireMembership(), getAllPayments);
router.post('/', requireMembership(['owner', 'manager']), addPayment);
router.put('/:paymentId', requireMembership(['owner']), updatePayment);
router.delete('/:paymentId', requireMembership(['owner']), deletePayment);

module.exports = router;