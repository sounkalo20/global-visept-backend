// routes/restaurant.routes.js
const express = require('express');
const router = express.Router();
const authenticate = require('../../middlewares/auth.middleware');
const { requireMembership } = require('../../middlewares/membership.middleware');
const { requirePermission } = require('../../middlewares/permission.middleware');
const {
    createDebt, getDebts, getDebtById, updateDebt, cancelDebt, getDebtStats,
} = require('../../controllers/restaurant/debt.controller');


router.use(authenticate);

// ─── DETTES ───────────────────────────────────────────
router.post('/debts', requireMembership(), requirePermission('sales.create'), createDebt);
router.get('/debts', requireMembership(), requirePermission('sales.view'), getDebts);
router.get('/debts/stats', requireMembership(), requirePermission('sales.view'), getDebtStats);
router.get('/debts/:id', requireMembership(), requirePermission('sales.view'), getDebtById);
router.put('/debts/:id', requireMembership(), requirePermission('sales.edit'), updateDebt);
router.put('/debts/:id/cancel', requireMembership(), requirePermission('sales.cancel'), cancelDebt);

module.exports = router;