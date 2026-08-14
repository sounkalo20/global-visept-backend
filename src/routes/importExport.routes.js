const express = require('express');
const router = express.Router();
const multer = require('multer');
const authenticate = require('../middlewares/auth.middleware');
const { requireMembership } = require('../middlewares/membership.middleware');
const importExportController = require('../controllers/importExport.controller');

// Configuration de multer avec stockage en mémoire pour analyse directe
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 Mo max
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.xlsx', '.xls', '.csv'];
    const lowerName = file.originalname.toLowerCase();
    const isValid = allowedExtensions.some(ext => lowerName.endsWith(ext));
    if (isValid) {
      cb(null, true);
    } else {
      cb(new Error('Format de fichier non supporté. Veuillez envoyer un fichier .xlsx ou .csv.'), false);
    }
  },
});

// Toutes les routes nécessitent l'authentification et l'appartenance à l'entreprise
router.use(authenticate);
router.use(requireMembership());

// 1. Télécharger un modèle officiel (Excel / CSV)
router.get('/template/:module', importExportController.getTemplate);

// 2. Analyser et prévisualiser un fichier importé (Dry-Run)
router.post('/preview/:module', upload.single('file'), importExportController.previewImport);

// 3. Exécuter l'importation définitive avec stratégie de doublons
router.post('/execute/:module', importExportController.executeImport);

// 4. Exporter les données existantes (Excel / CSV)
router.get('/export/:module', importExportController.exportData);

module.exports = router;
