// routes/warehouse.routes.js
const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouse.controller');
const authenticate = require('../middlewares/auth.middleware');

const { ownerSubscriptionContext, requireFeature } = require('../middlewares/subscription.middleware');

router.use(authenticate);
router.use(ownerSubscriptionContext);
router.use(requireFeature('module_warehouses'));

// ⚠️ ATTENTION : L'ORDRE EST CRUCIAL !
// Les routes avec des chemins fixes DOIVENT être avant les routes avec des paramètres dynamiques (:id)

// ─── ROUTES SPÉCIFIQUES (CHEMINS FIXES) ────────────────
// Ces routes sont définies AVANT les routes avec :id

// 1. Motifs d'ajustement
router.get('/adjustment-reasons', warehouseController.getAdjustmentReasons);

// 2. Recherche globale de produits
router.get('/search', warehouseController.searchGlobalProducts);

// 3. Ajustements par produit (spécifique avant :id)
router.get('/products/:catalog_product_id/adjustments', warehouseController.getProductAdjustments);

// ─── ROUTES AVEC PARAMÈTRES (CONTIENNENT :id OU :catalog_product_id) ──

// 4. Routes des produits dans les entrepôts
router.get('/product/:catalog_product_id', warehouseController.getProductWarehouseStocks);
router.get('/product/:catalog_product_id/movements', warehouseController.getProductWarehouseMovements);

// 5. Routes d'ajustement par entrepôt
router.post('/:id/adjust-stock', warehouseController.adjustWarehouseStock);
router.get('/:id/adjustments', warehouseController.getWarehouseAdjustments);

// 6. Routes de transfert
router.post('/:id/transfer', warehouseController.transferToShop);

// 7. Routes de stocks et mouvements
router.get('/:id/stocks', warehouseController.getWarehouseStocks);
router.get('/:id/movements', warehouseController.getWarehouseMovements);

// ─── ROUTES CRUD (EN DERNIER) ──────────────────────────
// Celles-ci doivent être en dernier car elles ont des chemins qui pourraient
// être confondus avec les routes spécifiques

router.get('/:id', warehouseController.getWarehouse);
router.put('/:id', warehouseController.updateWarehouse);
router.delete('/:id', warehouseController.deleteWarehouse);

// Routes CRUD sans paramètres (en dernier)
router.post('/', warehouseController.createWarehouse);
router.get('/', warehouseController.getWarehouses);

module.exports = router;