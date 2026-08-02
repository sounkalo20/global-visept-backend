const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const authenticate = require('../middlewares/auth.middleware');
const { requireMembership } = require('../middlewares/membership.middleware');
const pool = require('../config/db');
const AppError = require('../utils/AppError');

const { requirePermission } = require('../middlewares/permission.middleware');

// Toutes les routes nécessitent d'être authentifié
router.use(authenticate);

// ─── TABLEAU DE BORD ──────────────────────────────────────────────────────────
router.get('/dashboard/stats', requireMembership(), requirePermission('inventory.view'), inventoryController.getInventoryDashboard);

// ─── SESSIONS D'INVENTAIRE ────────────────────────────────────────────────────
router.post('/', requireMembership(), requirePermission('inventory.count'), inventoryController.createInventorySession);
router.get('/', requireMembership(), requirePermission('inventory.view'), inventoryController.getInventorySessions);
router.get('/:id', requireMembership(), requirePermission('inventory.view'), inventoryController.getInventorySession);

// ─── CYCLE DE VIE ─────────────────────────────────────────────────────────────
router.put('/:id/start', requireMembership(), requirePermission('inventory.count'), inventoryController.startInventory);
router.put('/:id/complete', requireMembership(), requirePermission('inventory.count'), inventoryController.completeInventory);
router.put('/:id/resume', requireMembership(), requirePermission('inventory.count'), inventoryController.resumeInventory);
router.put('/:id/validate', requireMembership(), requirePermission('inventory.count'), inventoryController.validateInventory);
router.put('/:id/cancel', requireMembership(), requirePermission('inventory.count'), inventoryController.cancelInventory);

// ─── ITEMS ────────────────────────────────────────────────────────────────────
router.put('/:id/items/:itemId', requireMembership(), requirePermission('inventory.count'), inventoryController.updateItemCount);

module.exports = router;

