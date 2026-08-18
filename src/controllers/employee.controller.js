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
        m.role_id,
        r.name as role_name,
        m.is_active,
        m.joined_at
       FROM users u
       JOIN memberships m ON u.id = m.user_id
       JOIN roles r ON m.role_id = r.id
       WHERE m.company_id = ? AND r.name != 'Propriétaire'
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
    const { first_name, last_name, email, phone, password, role_id } = req.body;

    if (!company_id) {
      throw new AppError("L'ID de l'entreprise est requis.", 400);
    }
    
    if (!role_id) {
      throw new AppError("Le rôle (role_id) est requis.", 400);
    }
    
    // Vérifier que le rôle existe pour cette entreprise
    const [roles] = await connection.query('SELECT name FROM roles WHERE id = ? AND company_id = ?', [role_id, company_id]);
    if (roles.length === 0) {
      throw new AppError("Ce rôle est invalide ou n'appartient pas à l'entreprise.", 400);
    }
    if (roles[0].name === 'Propriétaire') {
      throw new AppError("Vous ne pouvez pas assigner le rôle Propriétaire.", 400);
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
                'UPDATE memberships SET is_active = 1, role_id = ? WHERE id = ?',
                [role_id, existingMemberships[0].id]
            );
        } else {
            throw new AppError('Cet utilisateur fait déjà partie de la boutique.', 409);
        }
      } else {
        // L'utilisateur existe mais n'est pas dans l'entreprise, on l'ajoute
        await connection.query(
          `INSERT INTO memberships (user_id, company_id, role_id, is_active, joined_at)
           VALUES (?, ?, ?, 1, NOW())`,
          [userId, company_id, role_id]
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
        `INSERT INTO memberships (user_id, company_id, role_id, is_active, joined_at)
         VALUES (?, ?, ?, 1, NOW())`,
        [userId, company_id, role_id]
      );
    }

    await connection.commit();

    // Récupérer les données de l'employé créé/ajouté
    const [newEmployeeRows] = await connection.query(
      `SELECT 
        u.id, u.first_name, u.last_name, u.email, u.phone,
        m.id as membership_id, m.role_id, r.name as role_name, m.is_active, m.joined_at
       FROM users u
       JOIN memberships m ON u.id = m.user_id
       JOIN roles r ON m.role_id = r.id
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
    const { company_id, first_name, last_name, phone, password, role_id, is_active } = req.body;

    if (!company_id) {
      throw new AppError("L'ID de l'entreprise est requis.", 400);
    }

    // Vérifier que l'utilisateur appartient bien à l'entreprise et qu'on ne modifie pas le propriétaire
    const [memberships] = await connection.query(
      `SELECT m.id, r.name as role_name 
       FROM memberships m
       JOIN roles r ON m.role_id = r.id
       WHERE m.user_id = ? AND m.company_id = ?`,
      [id, company_id]
    );

    if (memberships.length === 0) {
      throw new AppError("Cet utilisateur ne fait pas partie de la boutique.", 404);
    }

    if (memberships[0].role_name === 'Propriétaire') {
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
    
    if (role_id) {
      // Vérifier que le rôle existe et n'est pas propriétaire
      const [roles] = await connection.query('SELECT name FROM roles WHERE id = ? AND company_id = ?', [role_id, company_id]);
      if (roles.length === 0) {
        throw new AppError("Ce rôle est invalide ou n'appartient pas à l'entreprise.", 400);
      }
      if (roles[0].name === 'Propriétaire') {
        throw new AppError("Vous ne pouvez pas assigner le rôle Propriétaire.", 400);
      }
      membershipUpdateFields.push('role_id = ?');
      membershipUpdateValues.push(role_id);
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
          m.id as membership_id, m.role_id, r.name as role_name, m.is_active, m.joined_at
         FROM users u
         JOIN memberships m ON u.id = m.user_id
         JOIN roles r ON m.role_id = r.id
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
      `SELECT m.id, r.name as role_name 
       FROM memberships m
       JOIN roles r ON m.role_id = r.id
       WHERE m.user_id = ? AND m.company_id = ?`,
      [id, company_id]
    );

    if (memberships.length === 0) {
      throw new AppError("Cet employé ne fait pas partie de la boutique.", 404);
    }

    if (memberships[0].role_name === 'Propriétaire') {
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

// ─── ACTIONS EN MASSE (BULK ACTIONS) ──────────────────
const bulkEmployeeAction = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const companyId = req.company?.id || req.body.company_id || req.query.company_id;
    const { ids, action, params = {} } = req.body;
    const currentUserId = req.user.id;

    if (!ids || ids.length === 0) {
      throw new AppError('Aucun employé sélectionné.', 400);
    }

    if (!companyId) {
      throw new AppError("L'ID de l'entreprise est requis.", 400);
    }

    // Récupérer les employés sélectionnés
    const [memberships] = await connection.query(
      `SELECT m.id as membership_id, m.user_id, m.is_active, m.role_id, r.name as role_name, u.first_name, u.last_name
       FROM memberships m
       JOIN users u ON m.user_id = u.id
       JOIN roles r ON m.role_id = r.id
       WHERE m.user_id IN (?) AND m.company_id = ?`,
      [ids, companyId]
    );

    const memberMap = new Map(memberships.map((m) => [m.user_id, m]));
    const results = [];
    let successCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    await connection.beginTransaction();

    if (action === 'activate') {
      for (const id of ids) {
        const mem = memberMap.get(id);
        const name = mem ? `${mem.first_name || ''} ${mem.last_name || ''}`.trim() : `#${id}`;

        if (!mem) {
          results.push({ id, status: 'failed', reason: 'Employé introuvable dans cette entreprise.' });
          failedCount++;
        } else if (mem.is_active === 1) {
          results.push({ id, name, status: 'skipped', reason: "L'employé est déjà actif." });
          skippedCount++;
        } else {
          await connection.query('UPDATE memberships SET is_active = 1 WHERE id = ?', [mem.membership_id]);
          results.push({ id, name, status: 'success', message: 'Accès activé.' });
          successCount++;
        }
      }
    } else if (action === 'deactivate') {
      for (const id of ids) {
        const mem = memberMap.get(id);
        const name = mem ? `${mem.first_name || ''} ${mem.last_name || ''}`.trim() : `#${id}`;

        if (!mem) {
          results.push({ id, status: 'failed', reason: 'Employé introuvable dans cette entreprise.' });
          failedCount++;
        } else if (id === currentUserId) {
          results.push({ id, name, status: 'skipped', reason: 'Vous ne pouvez pas désactiver votre propre compte.' });
          skippedCount++;
        } else if (mem.role_name === 'Propriétaire') {
          results.push({ id, name, status: 'skipped', reason: 'Impossible de désactiver le Propriétaire.' });
          skippedCount++;
        } else if (mem.is_active === 0) {
          results.push({ id, name, status: 'skipped', reason: "L'employé est déjà inactif." });
          skippedCount++;
        } else {
          await connection.query('UPDATE memberships SET is_active = 0 WHERE id = ?', [mem.membership_id]);
          results.push({ id, name, status: 'success', message: 'Accès désactivé.' });
          successCount++;
        }
      }
    } else if (action === 'change_role') {
      if (!params.role_id) {
        throw new AppError('Le nouveau rôle est requis.', 400);
      }

      const [targetRole] = await connection.query(
        'SELECT id, name FROM roles WHERE id = ? AND company_id = ?',
        [params.role_id, companyId]
      );

      if (targetRole.length === 0) {
        throw new AppError('Rôle cible introuvable dans cette entreprise.', 404);
      }
      if (targetRole[0].name === 'Propriétaire') {
        throw new AppError('Impossible d\'assigner le rôle Propriétaire en masse.', 403);
      }

      for (const id of ids) {
        const mem = memberMap.get(id);
        const name = mem ? `${mem.first_name || ''} ${mem.last_name || ''}`.trim() : `#${id}`;

        if (!mem) {
          results.push({ id, status: 'failed', reason: 'Employé introuvable dans cette entreprise.' });
          failedCount++;
        } else if (mem.role_name === 'Propriétaire') {
          results.push({ id, name, status: 'skipped', reason: 'Impossible de modifier le rôle du Propriétaire.' });
          skippedCount++;
        } else {
          await connection.query('UPDATE memberships SET role_id = ? WHERE id = ?', [params.role_id, mem.membership_id]);
          results.push({ id, name, status: 'success', message: `Rôle mis à jour vers "${targetRole[0].name}".` });
          successCount++;
        }
      }
    } else if (action === 'delete') {
      for (const id of ids) {
        const mem = memberMap.get(id);
        const name = mem ? `${mem.first_name || ''} ${mem.last_name || ''}`.trim() : `#${id}`;

        if (!mem) {
          results.push({ id, status: 'failed', reason: 'Employé introuvable dans cette entreprise.' });
          failedCount++;
        } else if (id === currentUserId) {
          results.push({ id, name, status: 'skipped', reason: 'Vous ne pouvez pas supprimer votre propre adhésion.' });
          skippedCount++;
        } else if (mem.role_name === 'Propriétaire') {
          results.push({ id, name, status: 'skipped', reason: 'Impossible de supprimer le Propriétaire.' });
          skippedCount++;
        } else {
          await connection.query('DELETE FROM memberships WHERE id = ?', [mem.membership_id]);
          results.push({ id, name, status: 'success', message: 'Employé retiré de la boutique.' });
          successCount++;
        }
      }
    }

    await connection.commit();

    res.status(200).json({
      success: true,
      message: `${successCount} employé(s) traité(s) avec succès.`,
      data: {
        total_requested: ids.length,
        success_count: successCount,
        skipped_count: skippedCount,
        failed_count: failedCount,
        results,
      },
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

module.exports = {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  bulkEmployeeAction,
};

