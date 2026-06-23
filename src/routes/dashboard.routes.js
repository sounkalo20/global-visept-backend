// routes/shop.routes.js (NOUVEAU ou AJOUTER à l'existant)
const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth.middleware');
const { requireMembership } = require('../middlewares/membership.middleware');
const { getDashboardStats } = require('../controllers/dashboard.controller');

router.use(authenticate);
router.get('/dashboard', requireMembership(), getDashboardStats);

module.exports = router;