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
} = require('../controllers/superAdmin/company.controller');
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


// ─── PLANS ────────────────────────────────────────────
router.get('/plans', getAllPlans);
router.get('/plans/stats', getPlanStats);
router.get('/plans/:id', getPlanDetail);
router.post('/plans', createPlan);
router.put('/plans/:id', updatePlan);
router.delete('/plans/:id', deletePlan);
router.put('/plans/:id/toggle-status', togglePlanStatus);

// Protection super_admin sur toutes les routes
router.use(authenticate);
router.use(requireSuperAdmin);

// ─── DASHBOARD ────────────────────────────────────────
router.get('/dashboard/stats', getPlatformStats);

// ─── COMPANIES ────────────────────────────────────────
router.get('/companies', getAllCompanies);
router.get('/companies/stats', getCompanyStats);
router.get('/companies/:id', getCompanyDetail);
router.put('/companies/:id/suspend', suspendCompany);
router.put('/companies/:id/reactivate', reactivateCompany);

// ─── PAYMENTS ─────────────────────────────────────────
router.get('/payments/pending', getPendingPayments);
router.put('/payments/:id/approve', approvePayment);
router.put('/payments/:id/reject', rejectPayment);



module.exports = router;