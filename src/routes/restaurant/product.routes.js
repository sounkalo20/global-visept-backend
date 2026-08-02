// routes/restaurant.routes.js
const express = require('express');
const router = express.Router();
const authenticate = require('../../middlewares/auth.middleware');
const { requireMembership } = require('../../middlewares/membership.middleware');
const { requirePermission } = require('../../middlewares/permission.middleware');
const { uploadProductImage } = require('../../middlewares/upload.middleware');

const {
    createDish,
    getDishes,
    getDishById,
    updateDish,
    deleteDish,
    toggleAvailability,
} = require('../../controllers/restaurant/product.controller');


router.use(authenticate);

// ─── PLATS ────────────────────────────────────────────
router.post('/dishes', uploadProductImage, requireMembership(), requirePermission('products.create'), createDish);
router.get('/dishes', requireMembership(), requirePermission('products.view'), getDishes);
router.get('/dishes/:id', requireMembership(), requirePermission('products.view'), getDishById);
router.put('/dishes/:id', requireMembership(), requirePermission('products.edit'), uploadProductImage, updateDish);
router.delete('/dishes/:id', requireMembership(), requirePermission('products.delete'), deleteDish);
router.put('/dishes/:id/toggle-availability', requireMembership(), requirePermission('products.edit'), toggleAvailability);

module.exports = router;