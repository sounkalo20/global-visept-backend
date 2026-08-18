const pool = require('../config/db');
const AppError = require('../utils/AppError');

/**
 * 1. subscriptionContext
 * Ce middleware s'exécute après requireMembership.
 * Il récupère les informations de l'abonnement et de ses fonctionnalités.
 * Il ajuste le statut ("past_due", "expired") dynamiquement si la date est dépassée.
 */
const subscriptionContext = async (req, res, next) => {
  try {
    const companyId = req.company?.id;
    if (!companyId) {
      return next();
    }

    const [companies] = await pool.query(
      `SELECT c.subscription_plan_id, c.subscription_status, c.subscription_ends_at, c.grace_period_ends_at, 
              sp.features, sp.max_products, sp.max_clients, sp.max_employees
       FROM companies c
       JOIN subscription_plans sp ON c.subscription_plan_id = sp.id
       WHERE c.id = ? AND c.deleted_at IS NULL`,
      [companyId]
    );

    if (companies.length === 0) {
      return next();
    }

    let company = companies[0];
    let status = company.subscription_status;
    const now = new Date();

    // Logique de modification à la volée du statut si dépassé
    if (status === 'active' && company.subscription_ends_at && new Date(company.subscription_ends_at) < now) {
      status = 'past_due';
    }

    if (status === 'past_due' && company.grace_period_ends_at && new Date(company.grace_period_ends_at) < now) {
      status = 'expired';
    }

    let features = {};
    if (company.features) {
      features = typeof company.features === 'string' ? JSON.parse(company.features) : company.features;
    }

    req.subscription = {
      status: status,
      planId: company.subscription_plan_id,
      features: features,
      limits: {
        max_products: company.max_products,
        max_clients: company.max_clients,
        max_employees: company.max_employees
      }
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 2. requireFeature
 * Middleware de Feature Gating (SaaS)
 * Bloque l'accès si la fonctionnalité n'est pas activée dans le forfait actuel.
 */
const requireFeature = (featureName) => {
  return (req, res, next) => {
    if (!req.subscription) {
      return next(); // Si pas de contexte abonnement (ex: route non entreprise), on skip.
    }

    if (req.subscription.status === 'expired' || req.subscription.status === 'canceled') {
      return res.status(403).json({
        success: false,
        error: "Abonnement expiré",
        message: "Votre abonnement a expiré ou est annulé. Veuillez renouveler pour accéder à cette fonctionnalité.",
        requireUpgrade: true
      });
    }

    if (!req.subscription.features || req.subscription.features[featureName] !== true) {
      return res.status(403).json({
        success: false,
        error: "Feature locked",
        message: "Cette fonctionnalité n'est pas disponible dans votre forfait actuel.",
        requireUpgrade: true
      });
    }

    next();
  };
};

/**
 * 3. enforceLimit
 * Middleware générique pour vérifier si une limite de forfait est atteinte.
 */
const enforceLimit = (limitKey, countFunction) => {
  return async (req, res, next) => {
    try {
      if (!req.subscription || !req.subscription.limits) {
        return next();
      }

      if (req.subscription.status === 'expired' || req.subscription.status === 'canceled') {
        return res.status(403).json({
          success: false,
          error: "Abonnement expiré",
          message: "Impossible de créer de nouvelles données. Votre abonnement a expiré.",
          requireUpgrade: true
        });
      }

      const limitValue = req.subscription.limits[limitKey];
      
      if (limitValue === null || limitValue === undefined) {
        return next();
      }

      const currentCount = await countFunction(req.company.id);

      if (currentCount >= limitValue) {
        return res.status(403).json({
          success: false,
          error: "Limit Reached",
          message: `Vous avez atteint la limite de votre forfait (${limitValue} ${limitKey}).`,
          requireUpgrade: true
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * 4. ownerSubscriptionContext
 * Pour les routes qui n'utilisent pas company_id mais owner_id (ex: warehouses).
 * Vérifie si au moins une des entreprises du propriétaire a la feature requise.
 */
const ownerSubscriptionContext = async (req, res, next) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) return next();

    const [companies] = await pool.query(
      `SELECT c.subscription_plan_id, c.subscription_status, sp.features 
       FROM companies c
       JOIN subscription_plans sp ON c.subscription_plan_id = sp.id
       JOIN memberships m ON m.company_id = c.id
       LEFT JOIN roles r ON m.role_id = r.id
       WHERE m.user_id = ? AND (r.name = 'Propriétaire' OR m.role = 'owner') AND c.deleted_at IS NULL`,
      [ownerId]
    );

    if (companies.length === 0) return next();

    // On consolide les features : si au moins une entreprise l'a, on l'autorise (ou on prend la meilleure)
    let aggregatedFeatures = {};
    let isAnyActive = false;

    for (let comp of companies) {
      if (comp.subscription_status === 'active' || comp.subscription_status === 'past_due') {
        isAnyActive = true;
      }
      let feats = {};
      if (comp.features) {
        feats = typeof comp.features === 'string' ? JSON.parse(comp.features) : comp.features;
      }
      for (const [key, val] of Object.entries(feats)) {
        if (val === true) aggregatedFeatures[key] = true;
      }
    }

    req.subscription = {
      status: isAnyActive ? 'active' : 'expired', // simplifé pour owner
      features: aggregatedFeatures
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  subscriptionContext,
  ownerSubscriptionContext,
  requireFeature,
  enforceLimit
};
