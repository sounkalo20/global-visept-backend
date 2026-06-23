// routes/restaurant.routes.js
const express = require('express');
const router = express.Router();
const authenticate = require('../../middlewares/auth.middleware');
const { requireMembership } = require('../../middlewares/membership.middleware');
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
router.post('/dishes', uploadProductImage,  requireMembership(['owner', 'manager']), createDish);
router.get('/dishes', requireMembership(), getDishes);
router.get('/dishes/:id', requireMembership(), getDishById);
router.put('/dishes/:id', requireMembership(['owner', 'manager']), uploadProductImage, updateDish);
router.delete('/dishes/:id', requireMembership(['owner']), deleteDish);
router.put('/dishes/:id/toggle-availability', requireMembership(['owner', 'manager']), toggleAvailability);

module.exports = router;