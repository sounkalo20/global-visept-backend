const express = require('express');
const router = express.Router();
const { createCompany, getMyCompanies, getCompanyById, getPaymentProofs, getCompanyInvoices, requestSubscriptionUpgrade, updateCompany } = require('../controllers/company.controller');
const authenticate = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { createCompanySchema } = require('../validators/company.validator');
const { uploadCompanyLogo, uploadPaymentProof } = require('../middlewares/upload.middleware');
const { requireMembership } = require('../middlewares/membership.middleware');

// Toutes les routes sont protégées
router.use(authenticate);

// POST /api/companies - Créer une entreprise
router.post('/', uploadCompanyLogo, (req, res, next) => {
  // Validation Zod après multer (car multer parse le body multipart)
  try {
    createCompanySchema.parse(req.body);
    next();
  } catch (error) {
    next(error);
  }
}, createCompany);

// GET /api/companies - Lister mes entreprises
router.get('/', getMyCompanies);

// GET /api/companies/:id - Détails d'une entreprise
router.get('/:id', getCompanyById);


// ─── MODIFIER UNE ENTREPRISE ────────────────────────────
router.put(
  '/:id',
  requireMembership(['owner', 'manager']),
  uploadCompanyLogo,
  updateCompany
);

// ─── UPGRADE ABONNEMENT ─────────────────────────────────
router.post(
  '/:id/subscription/upgrade',
  requireMembership(['owner']),
  uploadPaymentProof,
  requestSubscriptionUpgrade
);

// ─── FACTURES ───────────────────────────────────────────
router.get(
  '/:id/invoices',
  requireMembership(),
  getCompanyInvoices
);

// ─── PREUVES DE PAIEMENT ────────────────────────────────
router.get(
  '/:id/payment-proofs',
  requireMembership(),
  getPaymentProofs
);

module.exports = router;