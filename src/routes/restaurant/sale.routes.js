// routes/restaurant.routes.js
const express = require('express');
const router = express.Router();
const authenticate = require('../../middlewares/auth.middleware');
const { requireMembership } = require('../../middlewares/membership.middleware');
const { requirePermission } = require('../../middlewares/permission.middleware');
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
router.post('/sales', requireMembership(), requirePermission('sales.create'), createSale);
router.get('/sales', requireMembership(), requirePermission('sales.view'), getSales);
router.get('/sales/stats', requireMembership(), requirePermission('sales.view'), getSalesStats);
router.get('/sales/:id', requireMembership(), requirePermission('sales.view'), getSaleById);
router.put('/sales/:id', requireMembership(), requirePermission('sales.edit'), updateSale);
router.put('/sales/:id/cancel', requireMembership(), requirePermission('sales.cancel'), cancelSale);

module.exports = router;