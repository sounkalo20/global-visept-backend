const pool = require('../config/db');
const AppError = require('../utils/AppError');
const bcrypt = require('bcryptjs');

// ─── LISTER LES EMPLOYÉS DE L'ENTREPRISE ─────────────────────
const getEmployees = async (req, res, next) => {
  try {
    const { company_id } = req.query;

    if (!company_id) {
      throw new AppError("L'ID de l'entreprise est requis.", 400);
    }

    const [employees] = await pool.query(
      `SELECT 
        u.id, 
        u.first_name, 
        u.last_name, 
        u.email, 
        u.phone, 
        u.is_active as user_active,
        m.id as membership_id,
        m.role,
        m.is_active,
        m.joined_at
       FROM users u
       JOIN memberships m ON u.id = m.user_id
       WHERE m.company_id = ? AND m.role != 'owner'
       ORDER BY m.joined_at DESC`,
      [company_id]
    );

    res.status(200).json({
      success: true,
      data: {
        employees,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── CRÉER UN EMPLOYÉ (GÉRANT) ───────────────────────────────
const createEmployee = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { company_id } = req.body;
    const { first_name, last_name, email, phone, password, role } = req.body;

    if (!company_id) {
      throw new AppError("L'ID de l'entreprise est requis.", 400);
    }

    // Le rôle est forcé à manager pour le moment si non fourni,
    // ou on l'accepte s'il vient du front-end et on vérifie
    const assignedRole = role || 'manager';

    if (assignedRole !== 'manager') {
      throw new AppError("Pour le moment, seul le rôle 'gérant' est supporté.", 400);
    }

    let userId;

    // Vérifier si l'email existe déjà dans le système
    const [existingUsers] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      userId = existingUsers[0].id;
      
      // Vérifier si l'utilisateur est déjà dans cette entreprise
      const [existingMemberships] = await connection.query(
        'SELECT id, is_active FROM memberships WHERE user_id = ? AND company_id = ?',
        [userId, company_id]
      );

      if (existingMemberships.length > 0) {
        if (!existingMemberships[0].is_active) {
            // Réactiver l'adhésion si elle était désactivée
            await connection.query(
                'UPDATE memberships SET is_active = 1, role = ? WHERE id = ?',
                [assignedRole, existingMemberships[0].id]
            );
        } else {
            throw new AppError('Cet utilisateur fait déjà partie de la boutique.', 409);
        }
      } else {
        // L'utilisateur existe mais n'est pas dans l'entreprise, on l'ajoute
        await connection.query(
          `INSERT INTO memberships (user_id, company_id, role, is_active, joined_at)
           VALUES (?, ?, ?, 1, NOW())`,
          [userId, company_id, assignedRole]
        );
      }
    } else {
      // Créer le nouvel utilisateur
      if (!password) {
        throw new AppError("Un mot de passe est requis pour un nouvel utilisateur.", 400);
      }

      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      const [insertUser] = await connection.query(
        `INSERT INTO users (first_name, last_name, email, phone, password_hash, is_active)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [first_name, last_name, email, phone || null, password_hash]
      );

      userId = insertUser.insertId;

      // Ajouter l'utilisateur à l'entreprise
      await connection.query(
        `INSERT INTO memberships (user_id, company_id, role, is_active, joined_at)
         VALUES (?, ?, ?, 1, NOW())`,
        [userId, company_id, assignedRole]
      );
    }

    await connection.commit();

    // Récupérer les données de l'employé créé/ajouté
    const [newEmployeeRows] = await connection.query(
      `SELECT 
        u.id, u.first_name, u.last_name, u.email, u.phone,
        m.id as membership_id, m.role, m.is_active, m.joined_at
       FROM users u
       JOIN memberships m ON u.id = m.user_id
       WHERE u.id = ? AND m.company_id = ?`,
      [userId, company_id]
    );

    res.status(201).json({
      success: true,
      message: 'Employé ajouté avec succès.',
      data: {
        employee: newEmployeeRows[0],
      },
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// ─── MODIFIER UN EMPLOYÉ ─────────────────────────────────────
const updateEmployee = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params; // ID de l'utilisateur (user_id)
    const { company_id, first_name, last_name, phone, password, role, is_active } = req.body;

    if (!company_id) {
      throw new AppError("L'ID de l'entreprise est requis.", 400);
    }

    // Vérifier que l'utilisateur appartient bien à l'entreprise et qu'on ne modifie pas le propriétaire
    const [memberships] = await connection.query(
      'SELECT id, role FROM memberships WHERE user_id = ? AND company_id = ?',
      [id, company_id]
    );

    if (memberships.length === 0) {
      throw new AppError("Cet utilisateur ne fait pas partie de la boutique.", 404);
    }

    if (memberships[0].role === 'owner') {
      throw new AppError("Vous ne pouvez pas modifier le propriétaire via cette action.", 403);
    }

    // Mettre à jour l'utilisateur
    const updateFields = [];
    const updateValues = [];

    if (first_name) {
      updateFields.push('first_name = ?');
      updateValues.push(first_name);
    }
    if (last_name) {
      updateFields.push('last_name = ?');
      updateValues.push(last_name);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);
      updateFields.push('password_hash = ?');
      updateValues.push(password_hash);
    }

    if (updateFields.length > 0) {
      updateValues.push(id);
      await connection.query(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    }

    // Mettre à jour la membership si nécessaire
    const membershipUpdateFields = [];
    const membershipUpdateValues = [];
    
    if (role && role === 'manager') {
      membershipUpdateFields.push('role = ?');
      membershipUpdateValues.push(role);
    }
    
    if (is_active !== undefined) {
      membershipUpdateFields.push('is_active = ?');
      membershipUpdateValues.push(is_active ? 1 : 0);
    }

    if (membershipUpdateFields.length > 0) {
      membershipUpdateValues.push(memberships[0].id);
      await connection.query(
        `UPDATE memberships SET ${membershipUpdateFields.join(', ')} WHERE id = ?`,
        membershipUpdateValues
      );
    }

    await connection.commit();

    const [updatedEmployee] = await connection.query(
        `SELECT 
          u.id, u.first_name, u.last_name, u.email, u.phone,
          m.id as membership_id, m.role, m.is_active, m.joined_at
         FROM users u
         JOIN memberships m ON u.id = m.user_id
         WHERE u.id = ? AND m.company_id = ?`,
        [id, company_id]
      );

    res.status(200).json({
      success: true,
      message: 'Employé mis à jour avec succès.',
      data: {
        employee: updatedEmployee[0],
      },
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// ─── SUPPRIMER / DÉSACTIVER UN EMPLOYÉ ───────────────────────
const deleteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params; // user_id
    const { company_id } = req.query;

    if (!company_id) {
      throw new AppError("L'ID de l'entreprise est requis.", 400);
    }

    const [memberships] = await pool.query(
      'SELECT id, role FROM memberships WHERE user_id = ? AND company_id = ?',
      [id, company_id]
    );

    if (memberships.length === 0) {
      throw new AppError("Cet employé ne fait pas partie de la boutique.", 404);
    }

    if (memberships[0].role === 'owner') {
      throw new AppError("Vous ne pouvez pas supprimer le propriétaire de la boutique.", 403);
    }

    // On désactive simplement la membership ou on la supprime ?
    // C'est plus sûr de la désactiver ou de la supprimer de la table memberships
    await pool.query(
      'DELETE FROM memberships WHERE id = ?',
      [memberships[0].id]
    );

    res.status(200).json({
      success: true,
      message: 'Employé retiré de la boutique avec succès.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
