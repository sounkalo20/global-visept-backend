const express = require('express');
const router = express.Router();
const {
  createSale,
  getSales,
  getSaleById,
  updateSale,
  cancelSale,
  getSalesStats,
} = require('../controllers/sale.controller');
const authenticate = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { requireMembership } = require('../middlewares/membership.middleware');
const { createSaleSchema, updateSaleSchema } = require('../validators/sale.validator');

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// GET /api/sales/stats?company_id=X - Statistiques (accessible à tous les membres)
router.get(
  '/stats',
  requireMembership(),
  getSalesStats
);

// POST /api/sales - Créer une vente (owner, manager, cashier)
router.post(
  '/',
  validate(createSaleSchema),
  requireMembership(['owner', 'manager', 'cashier']),
  createSale
);

// GET /api/sales?company_id=X - Lister les ventes
router.get(
  '/',
  requireMembership(),
  getSales
);

// GET /api/sales/:id?company_id=X - Détails d'une vente
router.get(
  '/:id',
  requireMembership(),
  getSaleById
);

// PUT /api/sales/:id - Modifier une vente (owner, manager, cashier)
router.put(
  '/:id',
  validate(updateSaleSchema),
  requireMembership(['owner', 'manager', 'cashier']),
  updateSale
);

// POST /api/sales/:id/cancel - Annuler une vente (owner, manager, cashier)
router.post(
  '/:id/cancel',
  requireMembership(['owner', 'manager', 'cashier']),
  cancelSale
);

module.exports = router;