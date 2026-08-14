const express = require('express');
const router = express.Router();
const {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  bulkEmployeeAction,
} = require('../controllers/employee.controller');
const authenticate = require('../middlewares/auth.middleware');
const { requireMembership } = require('../middlewares/membership.middleware');
const { subscriptionContext, requireFeature, enforceLimit } = require('../middlewares/subscription.middleware');

// Toutes les routes nécessitent d'être authentifié
router.use(authenticate);
const { requirePermission } = require('../middlewares/permission.middleware');

// Actions en masse
router.post('/bulk', requireMembership(), requirePermission('employees.edit'), subscriptionContext, requireFeature('module_employees'), bulkEmployeeAction);

// Obtenir la liste des employés
// On utilise company_id dans les queries (req.query.company_id)
router.get('/', requireMembership(), requirePermission('employees.view'), subscriptionContext, requireFeature('module_employees'), getEmployees);

// Ajouter un employé
// company_id sera dans req.body (req.body.company_id)
const countEmployees = async (companyId) => {
  const pool = require('../config/db');
  // Compter le nombre de membres non propriétaires
  const [rows] = await pool.query(`
    SELECT COUNT(m.id) as count 
    FROM memberships m
    JOIN roles r ON m.role_id = r.id
    WHERE m.company_id = ? AND r.name != 'Propriétaire'
  `, [companyId]);
  return rows[0].count;
};

router.post('/', requireMembership(), requirePermission('employees.create'), subscriptionContext, requireFeature('module_employees'), enforceLimit('max_employees', countEmployees), createEmployee);

// Modifier un employé
router.put('/:id', requireMembership(), requirePermission('employees.edit'), subscriptionContext, requireFeature('module_employees'), updateEmployee);

// Supprimer un employé
router.delete('/:id', requireMembership(), requirePermission('employees.delete'), subscriptionContext, requireFeature('module_employees'), deleteEmployee);

module.exports = router;
