const express = require('express');
const router = express.Router();
const {
  getProfitSummary,
  getProfitEvolution,
  getCategoryProfits,
  getProductProfits
} = require('../controllers/profit.controller');
const authenticate = require('../middlewares/auth.middleware');
const { requireMembership } = require('../middlewares/membership.middleware');
const { requirePermission } = require('../middlewares/permission.middleware');

// Toutes les routes nécessitent une authentification et une appartenance valide à l'entreprise
router.use(authenticate);

// Synthèse des Bénéfices & KPI
router.get(
  '/summary',
  requireMembership(),
  requirePermission('sales.view_margin'),
  getProfitSummary
);

// Évolution temporelle (Graphique ligne/aire)
router.get(
  '/evolution',
  requireMembership(),
  requirePermission('sales.view_margin'),
  getProfitEvolution
);

// Répartition par Catégorie
router.get(
  '/categories',
  requireMembership(),
  requirePermission('sales.view_margin'),
  getCategoryProfits
);

// Rentabilité par Produit (Top & Produits à optimiser)
router.get(
  '/products',
  requireMembership(),
  requirePermission('sales.view_margin'),
  getProductProfits
);

module.exports = router;
