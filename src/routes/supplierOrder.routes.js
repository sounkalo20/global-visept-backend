// routes/supplierOrder.routes.js
const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth.middleware');
const { requireMembership } = require('../middlewares/membership.middleware');
const {
    createOrder,
    getOrders,
    getOrderById,
    updateOrder,
    cancelOrder,
    updateOrderStatus,
    receiveItems,
    addPayment,
    getOrderPayments,
    updatePayment,
    deletePayment,
} = require('../controllers/supplierOrder.controller');

router.use(authenticate);

// ─── COMMANDES ────────────────────────────────────────
router.post('/', requireMembership(['owner', 'manager']), createOrder);
router.get('/', requireMembership(), getOrders);
router.get('/:id', requireMembership(), getOrderById);
router.put('/:id', requireMembership(['owner', 'manager']), updateOrder);
router.put('/:id/cancel', requireMembership(['owner', 'manager']), cancelOrder);
router.put('/:id/status', requireMembership(['owner', 'manager']), updateOrderStatus);
router.put('/:id/receive', requireMembership(['owner', 'manager']), receiveItems);

// ─── PAIEMENTS ────────────────────────────────────────
router.post('/:id/payments', requireMembership(['owner', 'manager']), addPayment);
router.get('/:id/payments', requireMembership(), getOrderPayments);
router.put('/:id/payments/:paymentId', requireMembership(['owner']),  updatePayment);
router.delete('/:id/payments/:paymentId', requireMembership(['owner']), deletePayment);

module.exports = router;