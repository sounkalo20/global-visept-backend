// middlewares/superAdmin.middleware.js
const pool = require('../config/db');
const AppError = require('../utils/AppError');

const requireSuperAdmin = async (req, res, next) => {
  try {
    // Vérifier si l'utilisateur a une membership avec le rôle super_admin
    const [memberships] = await pool.query(
      'SELECT id, role FROM memberships WHERE user_id = ? AND role = ? AND is_active = 1',
      [req.user.id, 'super_admin']
    );

    if (memberships.length === 0) {
      throw new AppError('Accès réservé aux super administrateurs.', 403);
    }

    req.superAdmin = true;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = requireSuperAdmin;