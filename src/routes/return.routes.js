const express = require('express');
const router = express.Router();
const {
  createReturn,
  getReturns,
  getReturnById
} = require('../controllers/return.controller');
const authenticate = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { requireMembership } = require('../middlewares/membership.middleware');
const { createReturnSchema } = require('../validators/return.validator');

router.use(authenticate);

// POST /api/returns - Créer un retour
router.post(
  '/',
  validate(createReturnSchema),
  requireMembership(['owner', 'manager', 'cashier']),
  createReturn
);

// GET /api/returns - Lister les retours
router.get(
  '/',
  requireMembership(),
  getReturns
);

// GET /api/returns/:id - Détails d'un retour
router.get(
  '/:id',
  requireMembership(),
  getReturnById
);

module.exports = router;
