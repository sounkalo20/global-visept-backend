const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { generateToken } = require('../utils/token');
const AppError = require('../utils/AppError');

// ─── REGISTER ────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { first_name, last_name, email, phone, password } = req.body;

    // Vérifier unicité email
    const [existingEmail] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingEmail.length > 0) {
      throw new AppError('Cet email est déjà utilisé.', 409);
    }

    // Vérifier unicité téléphone si fourni
    if (phone) {
      const [existingPhone] = await pool.query(
        'SELECT id FROM users WHERE phone = ?',
        [phone]
      );

      if (existingPhone.length > 0) {
        throw new AppError('Ce numéro de téléphone est déjà utilisé.', 409);
      }
    }

    // Hasher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insérer l'utilisateur
    const [result] = await pool.query(
      `INSERT INTO users (first_name, last_name, email, phone, password_hash, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [first_name, last_name, email, phone || null, password_hash]
    );

    const userId = result.insertId;

    // Générer le token
    const token = generateToken({
      id: userId,
      email,
    });

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès.',
      data: {
        user: {
          id: userId,
          first_name,
          last_name,
          email,
          phone: phone || null,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── LOGIN ───────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { login, password } = req.body;

    // Chercher par email OU téléphone
    const [users] = await pool.query(
      'SELECT id, first_name, last_name, email, phone, password_hash, is_active FROM users WHERE email = ? OR phone = ?',
      [login, login]
    );

    if (users.length === 0) {
      throw new AppError('Email ou mot de passe incorrect.', 401);
    }

    const user = users[0];

    if (!user.is_active) {
      throw new AppError('Compte désactivé. Contactez le support.', 403);
    }

    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      throw new AppError('Email ou mot de passe incorrect.', 401);
    }

    // Mettre à jour last_login_at
    await pool.query(
      'UPDATE users SET last_login_at = NOW() WHERE id = ?',
      [user.id]
    );

    // Vérifier si super_admin
    const [adminRows] = await pool.query(
      'SELECT id FROM memberships WHERE user_id = ? AND role = ? AND is_active = 1',
      [user.id, 'super_admin']
    );

    // Générer le token
    const token = generateToken({
      id: user.id,
      email: user.email,
    });

    res.status(200).json({
      success: true,
      message: 'Connexion réussie.',
      data: {
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone,
          is_super_admin: adminRows.length > 0,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── ME ──────────────────────────────────────────────────
const me = async (req, res, next) => {
  try {
    const [users] = await pool.query(
      'SELECT id, first_name, last_name, email, phone, avatar_url, language, is_active, created_at, last_login_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      throw new AppError('Utilisateur introuvable.', 404);
    }

    // Récupérer le rôle super_admin si présent
    const [memberships] = await pool.query(
      'SELECT role FROM memberships WHERE user_id = ? AND role = ? AND is_active = 1',
      [req.user.id, 'super_admin']
    );

    const user = users[0];
    user.is_super_admin = memberships.length > 0;

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// ─── LOGOUT ──────────────────────────────────────────────
const logout = async (req, res, next) => {
  try {
    // Le logout côté serveur est simple car on utilise JWT stateless.
    // Optionnel : on peut blacklister le token (non implémenté ici pour rester simple).

    res.status(200).json({
      success: true,
      message: 'Déconnexion réussie.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, me, logout };