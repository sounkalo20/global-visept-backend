const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouse.controller');
const authenticate = require('../middlewares/auth.middleware');

router.use(authenticate);

// Gestion CRUD des entrepôts
router.post('/', warehouseController.createWarehouse);
router.get('/', warehouseController.getWarehouses);
router.get('/:id', warehouseController.getWarehouse);
router.put('/:id', warehouseController.updateWarehouse);
router.delete('/:id', warehouseController.deleteWarehouse);

// Gestion des stocks et mouvements
router.get('/:id/stocks', warehouseController.getWarehouseStocks);
router.get('/:id/movements', warehouseController.getWarehouseMovements);
router.get('/product/:catalog_product_id', warehouseController.getProductWarehouseStocks);
router.post('/:id/transfer', warehouseController.transferToShop);

module.exports = router;
