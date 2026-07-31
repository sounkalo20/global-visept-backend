const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const authenticate = require('../middlewares/auth.middleware');
const { requireMembership } = require('../middlewares/membership.middleware');
const pool = require('../config/db');
const AppError = require('../utils/AppError');

// Middleware spécifique qui lit company_id uniquement depuis query/body (jamais depuis :id)
const requireInventoryMembership = (allowedRoles = []) => async (req, res, next) => {
  try {
    const companyId = req.body?.company_id || req.query?.company_id;
    if (!companyId) throw new AppError("L'identifiant de l'entreprise (company_id) est requis.", 400);

    const [companies] = await pool.query('SELECT id, name, is_active FROM companies WHERE id = ? AND deleted_at IS NULL', [companyId]);
    if (companies.length === 0) throw new AppError("Entreprise introuvable.", 404);
    if (!companies[0].is_active) throw new AppError("Cette entreprise est désactivée.", 403);

    const [memberships] = await pool.query('SELECT role, is_active FROM memberships WHERE user_id = ? AND company_id = ?', [req.user.id, companyId]);
    if (memberships.length === 0) throw new AppError("Vous n'êtes pas membre de cette entreprise.", 403);
    if (!memberships[0].is_active) throw new AppError("Votre adhésion est désactivée.", 403);
    if (allowedRoles.length > 0 && !allowedRoles.includes(memberships[0].role)) {
      throw new AppError("Vous n'avez pas les droits nécessaires.", 403);
    }

    req.company = { id: companies[0].id, name: companies[0].name };
    req.membership = { role: memberships[0].role };
    next();
  } catch (err) {
    next(err);
  }
};

// Toutes les routes nécessitent d'être authentifié
router.use(authenticate);

const inventoryAuth = requireInventoryMembership(['owner', 'manager']);

// ─── TABLEAU DE BORD ──────────────────────────────────────────────────────────
router.get('/dashboard/stats', inventoryAuth, inventoryController.getInventoryDashboard);

// ─── SESSIONS D'INVENTAIRE ────────────────────────────────────────────────────
router.post('/', inventoryAuth, inventoryController.createInventorySession);
router.get('/', inventoryAuth, inventoryController.getInventorySessions);
router.get('/:id', inventoryAuth, inventoryController.getInventorySession);

// ─── CYCLE DE VIE ─────────────────────────────────────────────────────────────
router.put('/:id/start', inventoryAuth, inventoryController.startInventory);
router.put('/:id/complete', inventoryAuth, inventoryController.completeInventory);
router.put('/:id/resume', inventoryAuth, inventoryController.resumeInventory);
router.put('/:id/validate', inventoryAuth, inventoryController.validateInventory);
router.put('/:id/cancel', inventoryAuth, inventoryController.cancelInventory);

// ─── ITEMS ────────────────────────────────────────────────────────────────────
router.put('/:id/items/:itemId', inventoryAuth, inventoryController.updateItemCount);

module.exports = router;

