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
    processSplitPayment,
    updateItemStatus,
} = require('../../controllers/restaurant/sale.controller');

router.use(authenticate);

// ─── VENTES & PAIEMENTS FRACTIONNÉS ───────────────────
router.post('/sales', requireMembership(), requirePermission('sales.create'), createSale);
router.get('/sales', requireMembership(), requirePermission(['sales.view', 'kitchen.view']), getSales);
router.get('/sales/stats', requireMembership(), requirePermission('sales.view'), getSalesStats);

// Express Route Order: Spécifiques avant paramétrés :id
router.put('/sales/items/:itemId/status', requireMembership(), requirePermission(['kitchen.manage', 'sales.edit']), updateItemStatus);
router.post('/sales/:id/split-payment', requireMembership(), requirePermission('sales.create'), processSplitPayment);
router.put('/sales/:id/cancel', requireMembership(), requirePermission('sales.cancel'), cancelSale);
router.get('/sales/:id', requireMembership(), requirePermission(['sales.view', 'kitchen.view']), getSaleById);
router.put('/sales/:id', requireMembership(), requirePermission('sales.edit'), updateSale);


module.exports = router;