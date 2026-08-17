// routes/shop.routes.js (NOUVEAU ou AJOUTER à l'existant)
const express = require('express');
const router = express.Router();
const authenticate = require('../../middlewares/auth.middleware');
const { requireMembership } = require('../../middlewares/membership.middleware');
const { requirePermission } = require('../../middlewares/permission.middleware');
const { getDashboardStats } = require('../../controllers/restaurant/dashboard.controller');

router.use(authenticate);
router.get('/dashboard', requireMembership(), requirePermission('dashboard.view'), getDashboardStats);

module.exports = router;