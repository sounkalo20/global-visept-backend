const express = require('express');
const router = express.Router();
const { createCompany, getMyCompanies, getCompanyById } = require('../controllers/company.controller');
const authenticate = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { uploadCompanyLogo } = require('../middlewares/upload.middleware');
const { createCompanySchema } = require('../validators/company.validator');

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

module.exports = router;