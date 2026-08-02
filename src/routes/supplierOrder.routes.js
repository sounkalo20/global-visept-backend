// routes/supplierOrder.routes.js
const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth.middleware');
const { requireMembership } = require('../middlewares/membership.middleware');
const { requirePermission } = require('../middlewares/permission.middleware');
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
router.post('/', requireMembership(), requirePermission('purchases.create'), createOrder);
router.get('/', requireMembership(), requirePermission('purchases.view'), getOrders);
router.get('/:id', requireMembership(), requirePermission('purchases.view'), getOrderById);
router.put('/:id', requireMembership(), requirePermission('purchases.edit'), updateOrder);
router.put('/:id/cancel', requireMembership(), requirePermission('purchases.edit'), cancelOrder);
router.put('/:id/status', requireMembership(), requirePermission('purchases.edit'), updateOrderStatus);
router.put('/:id/receive', requireMembership(), requirePermission('purchases.receive'), receiveItems);

// ─── PAIEMENTS ────────────────────────────────────────
router.post('/:id/payments', requireMembership(), requirePermission('purchases.edit'), addPayment);
router.get('/:id/payments', requireMembership(), requirePermission('purchases.view'), getOrderPayments);
router.put('/:id/payments/:paymentId', requireMembership(), requirePermission('purchases.edit'), updatePayment);
router.delete('/:id/payments/:paymentId', requireMembership(), requirePermission('purchases.edit'), deletePayment);

module.exports = router;