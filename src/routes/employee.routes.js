const express = require('express');
const router = express.Router();
const {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require('../controllers/employee.controller');
const authenticate = require('../middlewares/auth.middleware');
const { requireMembership } = require('../middlewares/membership.middleware');

// Toutes les routes nécessitent d'être authentifié
router.use(authenticate);

// Obtenir la liste des employés (seulement le propriétaire)
// On utilise company_id dans les queries (req.query.company_id)
router.get('/', requireMembership(['owner']), getEmployees);

// Ajouter un employé (seulement le propriétaire)
// company_id sera dans req.body (req.body.company_id)
router.post('/', requireMembership(['owner']), createEmployee);

// Modifier un employé (seulement le propriétaire)
router.put('/:id', requireMembership(['owner']), updateEmployee);

// Supprimer un employé (seulement le propriétaire)
router.delete('/:id', requireMembership(['owner']), deleteEmployee);

module.exports = router;
