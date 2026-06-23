// routes/restaurant.routes.js
const express = require('express');
const router = express.Router();
const authenticate = require('../../middlewares/auth.middleware');
const { requireMembership } = require('../../middlewares/membership.middleware');
const {
    createSale,
    getSales,
    getSaleById,
    updateSale,
    cancelSale,
    getSalesStats,
} = require('../../controllers/restaurant/sale.controller');


router.use(authenticate);

// ─── VENTES ───────────────────────────────────────────
router.post('/sales', requireMembership(['owner', 'manager', 'cashier']), createSale);
router.get('/sales', requireMembership(), getSales);
router.get('/sales/stats', requireMembership(), getSalesStats);
router.get('/sales/:id', requireMembership(), getSaleById);
router.put('/sales/:id', requireMembership(['owner', 'manager']), updateSale);
router.put('/sales/:id/cancel', requireMembership(['owner', 'manager']), cancelSale);

module.exports = router;