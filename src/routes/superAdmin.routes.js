// routes/superAdmin.routes.js
const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth.middleware');
const requireSuperAdmin = require('../middlewares/requireSuperAdmin.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  getAllCompanies,
  getCompanyDetail,
  suspendCompany,
  reactivateCompany,
  getCompanyStats,
  createCompanyAdmin
} = require('../controllers/superAdmin/company.controller');
const {
  getAllOwners,
  createOwner,
  grantUnlimitedAccess,
  revokeUnlimitedAccess
} = require('../controllers/superAdmin/owner.controller');
const {
  getPendingPayments,
  approvePayment,
  rejectPayment,
} = require('../controllers/superAdmin/payment.controller');
const {
  getPlatformStats,
} = require('../controllers/superAdmin/dashboard.controller');
const {
  getAllPlans,
  getPlanDetail,
  createPlan,
  updatePlan,
  deletePlan,
  togglePlanStatus,
  getPlanStats,
} = require('../controllers/superAdmin/plan.controller');


// Protection de base: authentification requise pour toutes les routes
router.use(authenticate);

// ─── PLANS PUBLICS ────────────────────────────────────────────
// Cette route doit rester accessible aux propriétaires (owner) pour le choix de plan
router.get('/plans', getAllPlans);

// Protection stricte super_admin pour tout le reste
router.use(requireSuperAdmin);

// ─── GESTION DES PLANS (SUPER ADMIN UNIQUEMENT) ────────────────
router.get('/plans/stats', getPlanStats);
router.get('/plans/:id', getPlanDetail);
router.post('/plans', createPlan);
router.put('/plans/:id', updatePlan);
router.delete('/plans/:id', deletePlan);
router.put('/plans/:id/toggle-status', togglePlanStatus);

// ─── DASHBOARD ────────────────────────────────────────
router.get('/dashboard/stats', getPlatformStats);

// ─── COMPANIES ────────────────────────────────────────
router.get('/companies', getAllCompanies);
router.get('/companies/stats', getCompanyStats);
router.get('/companies/:id', getCompanyDetail);
router.put('/companies/:id/suspend', suspendCompany);
router.put('/companies/:id/reactivate', reactivateCompany);
router.post('/companies', createCompanyAdmin);

// ─── OWNERS ───────────────────────────────────────────
router.get('/owners', getAllOwners);
router.post('/owners', createOwner);
router.put('/owners/:id/grant-unlimited', grantUnlimitedAccess);
router.put('/owners/:id/revoke-unlimited', revokeUnlimitedAccess);

// ─── PAYMENTS ─────────────────────────────────────────
router.get('/payments/pending', getPendingPayments);
router.put('/payments/:id/approve', approvePayment);
router.put('/payments/:id/reject', rejectPayment);



module.exports = router;