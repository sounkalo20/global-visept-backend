// routes/restaurant/space.routes.js
const express = require('express');
const router = express.Router();
const authenticate = require('../../middlewares/auth.middleware');
const { requireMembership } = require('../../middlewares/membership.middleware');
const { requirePermission } = require('../../middlewares/permission.middleware');
const {
  getSpaces,
  createSpace,
  updateSpace,
  deleteSpace,
} = require('../../controllers/restaurant/space.controller');

router.use(authenticate);

router.get('/spaces', requireMembership(), requirePermission('tables.view'), getSpaces);
router.post('/spaces', requireMembership(), requirePermission('tables.manage'), createSpace);
router.put('/spaces/:id', requireMembership(), requirePermission('tables.manage'), updateSpace);
router.delete('/spaces/:id', requireMembership(), requirePermission('tables.manage'), deleteSpace);

module.exports = router;
