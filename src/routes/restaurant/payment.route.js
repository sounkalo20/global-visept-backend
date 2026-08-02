// routes/restaurant.routes.js
const express = require('express');
const router = express.Router();
const authenticate = require('../../middlewares/auth.middleware');
const { requireMembership } = require('../../middlewares/membership.middleware');
const { requirePermission } = require('../../middlewares/permission.middleware');
const {
  createPayment, getPayments, updatePayment, deletePayment,
} = require('../../controllers/restaurant/payment.controller');


router.use(authenticate);

// ─── PAIEMENTS ────────────────────────────────────────
router.post('/payments', requireMembership(), requirePermission('sales.create'), createPayment);
router.get('/payments', requireMembership(), requirePermission('sales.view'), getPayments);
router.put('/payments/:id', requireMembership(), requirePermission('sales.edit'), updatePayment);
router.delete('/payments/:id', requireMembership(), requirePermission('sales.delete'), deletePayment);

module.exports = router;