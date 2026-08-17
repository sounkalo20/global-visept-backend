const express = require('express');
const router = express.Router();
const { globalSearch } = require('../controllers/search.controller');
const authenticate = require('../middlewares/auth.middleware');
const { requireMembership } = require('../middlewares/membership.middleware');

// Toutes les routes de recherche nécessitent authentification et adhésion
router.use(authenticate);

// GET /api/search?q=xxx&company_id=yyy
router.get('/', requireMembership(), globalSearch);

module.exports = router;
