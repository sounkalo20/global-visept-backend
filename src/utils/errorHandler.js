const errorHandler = (err, req, res, next) => {
  console.error('ERROR:', err.message);

  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Erreurs MySQL
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Cette ressource existe déjà.',
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      success: false,
      message: 'Référence invalide.',
    });
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token invalide.',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expiré.',
    });
  }

  // Erreur Zod validation
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      message: 'Données invalides.',
      errors: err.errors,
    });
  }

  // Erreur inconnue
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur.',
  });
};

module.exports = errorHandler;