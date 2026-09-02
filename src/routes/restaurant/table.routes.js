// routes/restaurant/table.routes.js
const express = require('express');
const router = express.Router();
const authenticate = require('../../middlewares/auth.middleware');
const { requireMembership } = require('../../middlewares/membership.middleware');
const { requirePermission } = require('../../middlewares/permission.middleware');
const {
  getFloorPlan,
  createTable,
  updateTable,
  updatePositions,
  openSession,
  updateStatus,
  transferTable,
  mergeTables,
} = require('../../controllers/restaurant/table.controller');

router.use(authenticate);

router.get('/tables', requireMembership(), requirePermission('tables.view'), getFloorPlan);
router.post('/tables', requireMembership(), requirePermission('tables.manage'), createTable);
router.put('/tables/positions', requireMembership(), requirePermission('tables.manage'), updatePositions);
router.put('/tables/:id', requireMembership(), requirePermission('tables.manage'), updateTable);

// Sessions & Statuts
router.post('/tables/open-session', requireMembership(), requirePermission('tables.open'), openSession);
router.put('/tables/:id/status', requireMembership(), requirePermission('tables.status'), updateStatus);

// Transfert & Fusion
router.post('/tables/transfer', requireMembership(), requirePermission('tables.transfer'), transferTable);
router.post('/tables/merge', requireMembership(), requirePermission('tables.merge'), mergeTables);

module.exports = router;
