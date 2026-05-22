const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AppError = require('../utils/AppError');


// =========================
// DOSSIERS UPLOADS
// =========================

const companiesUploadDir = path.join(
  __dirname,
  '..',
  'uploads',
  'companies'
);

const productsUploadDir = path.join(
  __dirname,
  '..',
  'uploads',
  'products'
);


// =========================
// CREATE DIRS IF NOT EXISTS
// =========================

if (!fs.existsSync(companiesUploadDir)) {
  fs.mkdirSync(companiesUploadDir, { recursive: true });
}

if (!fs.existsSync(productsUploadDir)) {
  fs.mkdirSync(productsUploadDir, { recursive: true });
}


// =========================
// FILE FILTER
// =========================

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/png',
    'image/jpeg',
    'image/jpg',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'Format de fichier non supporté. Utilisez PNG, JPG ou JPEG.',
        400
      ),
      false
    );
  }
};


// =========================
// COMPANY STORAGE
// =========================

const companyStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, companiesUploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueSuffix =
      Date.now() + '-' + Math.round(Math.random() * 1e9);

    const ext = path.extname(file.originalname);

    cb(null, `company-${uniqueSuffix}${ext}`);
  },
});


// =========================
// PRODUCT STORAGE
// =========================

const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, productsUploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueSuffix =
      Date.now() + '-' + Math.round(Math.random() * 1e9);

    const ext = path.extname(file.originalname);

    cb(null, `product-${uniqueSuffix}${ext}`);
  },
});


// =========================
// MULTER INSTANCES
// =========================

const uploadCompany = multer({
  storage: companyStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const uploadProduct = multer({
  storage: productStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});


module.exports = {
  uploadCompany,
  uploadProduct,
};