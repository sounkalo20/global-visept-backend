const pool = require('../config/db');
const AppError = require('../utils/AppError');

// ─── OBTENIR TOUTES LES PERMISSIONS SYSTÈME ───
const getAllPermissions = async (req, res, next) => {
  try {
    const [permissions] = await pool.query('SELECT * FROM permissions ORDER BY module, name');
    
    // Grouper par module pour faciliter l'affichage frontend
    const groupedPermissions = permissions.reduce((acc, curr) => {
      if (!acc[curr.module]) {
        acc[curr.module] = [];
      }
      acc[curr.module].push(curr);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        grouped_permissions: groupedPermissions,
        permissions
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── OBTENIR LES PERMISSIONS DE L'UTILISATEUR ACTUEL (POUR L'ENTREPRISE ACTIVE) ───
const getMyPermissions = async (req, res, next) => {
  try {
    const roleId = req.membership.role_id;
    if (!roleId) {
      return res.status(200).json({ success: true, data: { permissions: [] } });
    }

    const [permissions] = await pool.query(`
      SELECT p.code 
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
    `, [roleId]);

    const userPermissions = permissions.map(p => p.code);

    res.status(200).json({
      success: true,
      data: {
        permissions: userPermissions,
        is_system_role: req.membership.is_system_role,
        role_name: req.membership.role_name
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── LISTER LES RÔLES DE L'ENTREPRISE ───
const getRoles = async (req, res, next) => {
  try {
    const companyId = req.company.id;
    
    const [roles] = await pool.query(`
      SELECT r.*, COUNT(m.id) as users_count
      FROM roles r
      LEFT JOIN memberships m ON m.role_id = r.id AND m.is_active = 1
      WHERE r.company_id = ?
      GROUP BY r.id
      ORDER BY r.is_system DESC, r.name ASC
    `, [companyId]);

    // Pour chaque rôle, récupérer ses permissions
    for (let role of roles) {
      const [perms] = await pool.query(`
        SELECT p.code
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ?
      `, [role.id]);
      role.permissions = perms.map(p => p.code);
    }

    res.status(200).json({
      success: true,
      data: { roles }
    });
  } catch (error) {
    next(error);
  }
};

// ─── CRÉER UN RÔLE ───
const createRole = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const companyId = req.company.id;
    const { name, description, permissions } = req.body; // permissions est un tableau de codes ['sales.view', ...]

    if (!name) {
      throw new AppError("Le nom du rôle est requis.", 400);
    }

    // 1. Créer le rôle
    const [result] = await connection.query(
      'INSERT INTO roles (company_id, name, description, is_system) VALUES (?, ?, ?, 0)',
      [companyId, name, description || null]
    );
    const roleId = result.insertId;

    // 2. Assigner les permissions
    if (permissions && Array.isArray(permissions) && permissions.length > 0) {
      // Résoudre les codes en IDs
      const [permRows] = await connection.query('SELECT id FROM permissions WHERE code IN (?)', [permissions]);
      const permIds = permRows.map(p => [roleId, p.id]);
      
      if (permIds.length > 0) {
        await connection.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ?', [permIds]);
      }
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Rôle créé avec succès.",
      data: { role_id: roleId }
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// ─── MODIFIER UN RÔLE ───
const updateRole = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const companyId = req.company.id;
    const roleId = req.params.id;
    const { name, description, permissions } = req.body;

    // Vérifier si le rôle existe et appartient à l'entreprise
    const [roles] = await connection.query('SELECT * FROM roles WHERE id = ? AND company_id = ?', [roleId, companyId]);
    
    if (roles.length === 0) {
      throw new AppError("Rôle introuvable.", 404);
    }
    
    if (roles[0].is_system && roles[0].name === 'Propriétaire') {
      throw new AppError("Le rôle Propriétaire ne peut pas être modifié.", 403);
    }

    // 1. Mettre à jour les infos du rôle
    await connection.query(
      'UPDATE roles SET name = ?, description = ? WHERE id = ?',
      [name || roles[0].name, description !== undefined ? description : roles[0].description, roleId]
    );

    // 2. Mettre à jour les permissions si fournies
    if (permissions && Array.isArray(permissions)) {
      // On supprime les anciennes
      await connection.query('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);
      
      if (permissions.length > 0) {
        // Résoudre les codes en IDs
        const [permRows] = await connection.query('SELECT id FROM permissions WHERE code IN (?)', [permissions]);
        const permIds = permRows.map(p => [roleId, p.id]);
        
        if (permIds.length > 0) {
          await connection.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ?', [permIds]);
        }
      }
    }

    await connection.commit();

    res.status(200).json({
      success: true,
      message: "Rôle mis à jour avec succès."
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// ─── SUPPRIMER UN RÔLE ───
const deleteRole = async (req, res, next) => {
  try {
    const companyId = req.company.id;
    const roleId = req.params.id;

    const [roles] = await pool.query('SELECT * FROM roles WHERE id = ? AND company_id = ?', [roleId, companyId]);
    
    if (roles.length === 0) {
      throw new AppError("Rôle introuvable.", 404);
    }
    
    if (roles[0].is_system) {
      throw new AppError("Impossible de supprimer un rôle système.", 403);
    }

    // Vérifier si des employés utilisent ce rôle
    const [users] = await pool.query('SELECT id FROM memberships WHERE role_id = ?', [roleId]);
    if (users.length > 0) {
      throw new AppError(`Impossible de supprimer ce rôle car il est assigné à ${users.length} employé(s). Réassignez-les d'abord.`, 400);
    }

    await pool.query('DELETE FROM roles WHERE id = ?', [roleId]);

    res.status(200).json({
      success: true,
      message: "Rôle supprimé avec succès."
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllPermissions,
  getMyPermissions,
  getRoles,
  createRole,
  updateRole,
  deleteRole
};
