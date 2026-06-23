// routes/restaurant.routes.js
const express = require('express');
const router = express.Router();
const authenticate = require('../../middlewares/auth.middleware');
const { requireMembership } = require('../../middlewares/membership.middleware');
const {
    createDebt, getDebts, getDebtById, updateDebt, cancelDebt, getDebtStats,
} = require('../../controllers/restaurant/debt.controller');


router.use(authenticate);

// ─── DETTES ───────────────────────────────────────────
router.post('/debts', requireMembership(['owner', 'manager', 'cashier']), createDebt);
router.get('/debts', requireMembership(), getDebts);
router.get('/debts/stats', requireMembership(), getDebtStats);
router.get('/debts/:id', requireMembership(), getDebtById);
router.put('/debts/:id', requireMembership(['owner', 'manager']), updateDebt);
router.put('/debts/:id/cancel', requireMembership(['owner', 'manager']), cancelDebt);

module.exports = router;