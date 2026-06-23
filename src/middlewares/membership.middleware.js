const pool = require('../config/db');
const AppError = require('../utils/AppError');

/**
 * Vérifie que l'utilisateur connecté est bien membre de l'entreprise spécifiée.
 * Extrait le company_id depuis req.body, req.params ou req.query.
 */
const requireMembership = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      const companyId =
        req.body?.company_id ||
        req.params?.company_id ||
        req.query?.company_id ||
        req.params?.id ||
        req.params?.companyId;

      if (!companyId) {
        throw new AppError(
          "L'identifiant de l'entreprise (company_id) est requis.",
          400
        );
      }

      // Vérifier que l'entreprise existe et est active
      const [companies] = await pool.query(
        'SELECT id, name, is_active FROM companies WHERE id = ? AND deleted_at IS NULL',
        [companyId]
      );

      if (companies.length === 0) {
        throw new AppError("Entreprise introuvable.", 404);
      }

      if (!companies[0].is_active) {
        throw new AppError("Cette entreprise est désactivée.", 403);
      }

      // Vérifier que l'utilisateur est membre de cette entreprise
      const [memberships] = await pool.query(
        'SELECT id, role, is_active FROM memberships WHERE user_id = ? AND company_id = ?',
        [req.user.id, companyId]
      );

      if (memberships.length === 0) {
        throw new AppError(
          "Vous n'êtes pas membre de cette entreprise.",
          403
        );
      }

      if (!memberships[0].is_active) {
        throw new AppError(
          "Votre adhésion à cette entreprise est désactivée.",
          403
        );
      }

      // Vérifier le rôle si nécessaire
      if (
        allowedRoles.length > 0 &&
        !allowedRoles.includes(memberships[0].role)
      ) {
        throw new AppError(
          "Vous n'avez pas les droits nécessaires pour effectuer cette action.",
          403
        );
      }

      // Injecter les infos dans req
      req.company = {
        id: companies[0].id,
        name: companies[0].name,
      };

      req.membership = {
        role: memberships[0].role,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { requireMembership };