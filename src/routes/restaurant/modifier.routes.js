// routes/restaurant/modifier.routes.js
const express = require('express');
const router = express.Router();
const authenticate = require('../../middlewares/auth.middleware');
const { requireMembership } = require('../../middlewares/membership.middleware');
const { requirePermission } = require('../../middlewares/permission.middleware');
const {
  getModifierGroups,
  createModifierGroup,
  updateModifierGroup,
  deleteModifierGroup,
  getDishModifierGroups,
  setDishModifierGroups,
} = require('../../controllers/restaurant/modifier.controller');

router.use(authenticate);

// ── Groupes de modificateurs ─────────────────────────────────
router.get(
  '/modifier-groups',
  requireMembership(), requirePermission('products.view'),
  getModifierGroups
);
router.post(
  '/modifier-groups',
  requireMembership(), requirePermission('products.create'),
  createModifierGroup
);
router.put(
  '/modifier-groups/:id',
  requireMembership(), requirePermission('products.edit'),
  updateModifierGroup
);
router.delete(
  '/modifier-groups/:id',
  requireMembership(), requirePermission('products.delete'),
  deleteModifierGroup
);

// ── Associations Plat <-> Groupes ────────────────────────────
router.get(
  '/dishes/:dishId/modifiers',
  requireMembership(), requirePermission('products.view'),
  getDishModifierGroups
);
router.put(
  '/dishes/:dishId/modifiers',
  requireMembership(), requirePermission('products.edit'),
  setDishModifierGroups
);

module.exports = router;
