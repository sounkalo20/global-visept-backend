const express = require('express');
const router = express.Router();
const {
  getCashRegisters,
  createCashRegister,
  openSession,
  closeSession,
  getActiveSession,
  getSessionHistory,
  getCashMovements,
  assignUserToRegister,
  unassignUserFromRegister,
  getAssignedUsers
} = require('../controllers/cash.controller');
const authenticate = require('../middlewares/auth.middleware');
const { requireMembership } = require('../middlewares/membership.middleware');
const { requirePermission } = require('../middlewares/permission.middleware');

router.use(authenticate);

// --- Caisses Physiques (Registers) ---
router.get(
  '/registers',
  requireMembership(),
  getCashRegisters
);

router.post(
  '/registers',
  requireMembership(),
  requirePermission('cash.registers.manage'),
  createCashRegister
);

router.post(
  '/registers/assign',
  requireMembership(),
  requirePermission('cash.registers.manage'),
  assignUserToRegister
);

router.post(
  '/registers/unassign',
  requireMembership(),
  requirePermission('cash.registers.manage'),
  unassignUserFromRegister
);

router.get(
  '/registers/:cash_register_id/users',
  requireMembership(),
  requirePermission('cash.registers.manage'),
  getAssignedUsers
);

// --- Sessions de Caisse ---
// Obtenir la session active de l'utilisateur courant
router.get(
  '/sessions/active',
  requireMembership(),
  getActiveSession
);

// Historique des sessions
router.get(
  '/sessions',
  requireMembership(),
  requirePermission('cash.sessions.view'),
  getSessionHistory
);

// Ouvrir une session
router.post(
  '/sessions/open',
  requireMembership(),
  requirePermission('cash.sessions.manage'),
  openSession
);

// Clôturer une session
router.post(
  '/sessions/:id/close',
  requireMembership(),
  requirePermission('cash.sessions.manage'),
  closeSession
);

// --- Mouvements ---
// Obtenir les mouvements d'une session
router.get(
  '/sessions/:id/movements',
  requireMembership(),
  requirePermission('cash.sessions.view'),
  getCashMovements
);

module.exports = router;
