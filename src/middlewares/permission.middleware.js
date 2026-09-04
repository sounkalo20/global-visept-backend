const pool = require('../config/db');
const AppError = require('../utils/AppError');

/**
 * Middleware pour vérifier si l'utilisateur possède une permission spécifique.
 * Il s'attend à ce que req.company et req.membership soient déjà injectés par requireMembership.
 */
const requirePermission = (requiredPermissionCode) => {
  return async (req, res, next) => {
    try {
      if (!req.company || !req.membership) {
        throw new AppError("Contexte d'entreprise manquant.", 500);
      }

      // Si c'est le super admin global (optionnel selon l'implémentation existante)
      if (req.user && req.user.is_super_admin) {
        return next();
      }

      // Récupérer le rôle et ses permissions
      const roleId = req.membership.role_id;
      if (!roleId) {
        throw new AppError("Aucun rôle assigné pour cet utilisateur.", 403);
      }

      const [roleData] = await pool.query(
        'SELECT is_system, name FROM roles WHERE id = ? AND company_id = ?',
        [roleId, req.company.id]
      );

      if (roleData.length === 0) {
        throw new AppError("Le rôle assigné est introuvable ou invalide.", 403);
      }

      const role = roleData[0];

      // Vérifier les permissions
      const [permissions] = await pool.query(`
        SELECT p.code 
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ?
      `, [roleId]);

      const userPermissions = permissions.map(p => p.code);

      // Le Propriétaire a tous les droits
      if (role.is_system && role.name === 'Propriétaire') {
        req.membership.permissions = userPermissions; // vide par défaut
        req.membership.role_name = role.name;
        req.membership.is_system_role = role.is_system;
        return next();
      }

      // Autoriser si l'utilisateur a la permission demandée (tableau ou chaîne)
      const permsToCheck = Array.isArray(requiredPermissionCode) ? requiredPermissionCode : [requiredPermissionCode];
      const hasAccess = permsToCheck.some(code => userPermissions.includes(code));

      if (hasAccess) {
        // Injecter les permissions dans req pour un usage ultérieur si besoin
        req.membership.permissions = userPermissions;
        req.membership.role_name = role.name;
        req.membership.is_system_role = role.is_system;
        return next();
      }

      throw new AppError("Accès refusé. Vous n'avez pas la permission nécessaire.", 403);
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { requirePermission };
