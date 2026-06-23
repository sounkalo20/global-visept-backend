// routes/restaurant.routes.js
const express = require('express');
const router = express.Router();
const authenticate = require('../../middlewares/auth.middleware');
const { requireMembership } = require('../../middlewares/membership.middleware');
const {
  createPayment, getPayments, updatePayment, deletePayment,
} = require('../../controllers/restaurant/payment.controller');


router.use(authenticate);

// ─── PAIEMENTS ────────────────────────────────────────
router.post('/payments', requireMembership(['owner', 'manager', 'cashier']), createPayment);
router.get('/payments', requireMembership(), getPayments);
router.put('/payments/:id', requireMembership(['owner', 'manager']), updatePayment);
router.delete('/payments/:id', requireMembership(['owner']), deletePayment);

module.exports = router;