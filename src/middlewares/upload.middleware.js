const { uploadCompany, uploadProduct, uploadPayment } = require('../config/multer.config');
const AppError = require('../utils/AppError');

const handleUpload = (uploadInstance) => (req, res, next) => {
  uploadInstance.single('image')(req, res, (err) => {

    // DEBUG IMPORTANT
    if (err) {
      console.error('UPLOAD ERROR =>', err);

      if (err instanceof AppError) {
        return next(err);
      }

      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(
          new AppError(
            'Le fichier est trop volumineux. Maximum 5 MB.',
            400
          )
        );
      }

      // RETOURNER LA VRAIE ERREUR
      return next(
        new AppError(err.message || "Erreur lors de l'upload du fichier.", 500)
      );
    }

    next();
  });
};

const uploadCompanyLogo = handleUpload(uploadCompany);
const uploadProductImage = handleUpload(uploadProduct);
const uploadPaymentProof = handleUpload(uploadPayment);

module.exports = {
  uploadCompanyLogo,
  uploadProductImage,
  uploadPaymentProof
};