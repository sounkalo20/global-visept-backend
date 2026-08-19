const { verifyToken } = require("../utils/token");
const AppError = require("../utils/AppError");
const pool = require("../config/db");

const authenticate = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      throw new AppError("Token manquant. Accès non autorisé.", 401);
    }
    const decoded = verifyToken(token);

    // Vérifier que l'utilisateur existe toujours et est actif
    const [users] = await pool.query(
      "SELECT id, first_name, last_name, email, phone, is_active FROM users WHERE id = ?",
      [decoded.id],
    );

    if (users.length === 0) {
      throw new AppError("Utilisateur introuvable.", 401);
    }

    if (!users[0].is_active) {
      throw new AppError("Compte désactivé. Contactez le support.", 403);
    }

    req.user = {
      id: users[0].id,
      first_name: users[0].first_name,
      last_name: users[0].last_name,
      email: users[0].email,
      phone: users[0].phone,
      is_active: users[0].is_active,
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authenticate;
