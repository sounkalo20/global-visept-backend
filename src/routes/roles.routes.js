const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth.middleware');
const { requireMembership } = require('../middlewares/membership.middleware');
const { requirePermission } = require('../middlewares/permission.middleware');
const { requireFeature } = require('../middlewares/subscription.middleware');
const {
  getAllPermissions,
  getMyPermissions,
  getRoles,
  createRole,
  updateRole,
  deleteRole
} = require('../controllers/roles.controller');

// Toutes les routes nécessitent d'être connecté
router.use(authenticate);

// Obtenir toutes les permissions système (utilisé par le frontend pour afficher la grille)
router.get('/permissions', getAllPermissions);

// Toutes les routes suivantes nécessitent un company_id
router.use('/:company_id', requireMembership());

// Obtenir les permissions de l'utilisateur actif pour l'entreprise
router.get('/:company_id/my-permissions', getMyPermissions);

// Middleware d'abonnement pour la gestion des rôles et employés (Feature Gating)
// On suppose que la gestion avancée des employés nécessite au moins un certain plan ou est gérée globalement
// Le user veut "Si le module 'Employés' n'est pas inclus dans le forfait, le propriétaire ne pourra pas créer de rôles ni gérer les employés"
// Pour l'instant, on met juste requireSubscription, le système d'abonnement gérera les limites si implémenté.
router.use('/:company_id/roles', requireFeature('module_employees'));

// CRUD Rôles - Nécessite la permission "roles.manage"
router.get('/:company_id/roles', requirePermission('roles.manage'), getRoles);
router.post('/:company_id/roles', requirePermission('roles.manage'), createRole);
router.put('/:company_id/roles/:id', requirePermission('roles.manage'), updateRole);
router.delete('/:company_id/roles/:id', requirePermission('roles.manage'), deleteRole);

module.exports = router;
