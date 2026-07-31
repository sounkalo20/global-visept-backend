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
const { subscriptionContext, requireFeature, enforceLimit } = require('../middlewares/subscription.middleware');

// Toutes les routes nécessitent d'être authentifié
router.use(authenticate);

// Obtenir la liste des employés (seulement le propriétaire)
// On utilise company_id dans les queries (req.query.company_id)
router.get('/', requireMembership(['owner']), subscriptionContext, requireFeature('module_employees'), getEmployees);

// Ajouter un employé (seulement le propriétaire)
// company_id sera dans req.body (req.body.company_id)
const countEmployees = async (companyId) => {
  const pool = require('../config/db');
  const [rows] = await pool.query('SELECT COUNT(id) as count FROM memberships WHERE company_id = ? AND role != "owner"', [companyId]);
  return rows[0].count;
};

router.post('/', requireMembership(['owner']), subscriptionContext, requireFeature('module_employees'), enforceLimit('max_employees', countEmployees), createEmployee);

// Modifier un employé (seulement le propriétaire)
router.put('/:id', requireMembership(['owner']), subscriptionContext, requireFeature('module_employees'), updateEmployee);

// Supprimer un employé (seulement le propriétaire)
router.delete('/:id', requireMembership(['owner']), subscriptionContext, requireFeature('module_employees'), deleteEmployee);

module.exports = router;
