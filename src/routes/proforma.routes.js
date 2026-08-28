const express = require('express');
const router = express.Router();
const {
  createProforma,
  getProformas,
  getProformaById,
  updateProforma,
  cancelProforma,
} = require('../controllers/proforma.controller');
const authenticate = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { requireMembership } = require('../middlewares/membership.middleware');
const {
  createProformaSchema,
  updateProformaSchema,
} = require('../validators/proforma.validator');

// TOUTES LES ROUTES NÉCESSITENT UNE AUTHENTIFICATION
router.use(authenticate);

// POST /api/proformas - Créer un proforma (owner, manager, cashier)
router.post(
  '/',
  validate(createProformaSchema),
  requireMembership(['owner', 'manager', 'cashier']),
  createProforma
);

// GET /api/proformas?company_id=X - Lister les proformas
router.get(
  '/',
  requireMembership(),
  getProformas
);

// GET /api/proformas/:id?company_id=X - Détails d'un proforma
router.get(
  '/:id',
  requireMembership(),
  getProformaById
);

// PUT /api/proformas/:id - Modifier un proforma
router.put(
  '/:id',
  validate(updateProformaSchema),
  requireMembership(['owner', 'manager', 'cashier']),
  updateProforma
);

// POST /api/proformas/:id/cancel - Annuler un proforma
router.post(
  '/:id/cancel',
  requireMembership(['owner', 'manager', 'cashier']),
  cancelProforma
);

module.exports = router;
