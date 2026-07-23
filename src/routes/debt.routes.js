const express = require('express');
const router = express.Router();
const { createDebt, getDebts, getDebtById, updateDebt, cancelDebt, getDebtStats } = require('../controllers/debt.controller');
const authenticate = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { requireMembership } = require('../middlewares/membership.middleware');
const { createDebtSchema, updateDebtSchema } = require('../validators/debt.validator');

router.use(authenticate);

router.get('/stats', requireMembership(), getDebtStats);
router.post('/', validate(createDebtSchema), requireMembership(['owner', 'manager', 'cashier']), createDebt);
router.get('/', requireMembership(), getDebts);
router.get('/:id', requireMembership(), getDebtById);
router.put('/:id', validate(updateDebtSchema), requireMembership(['owner', 'manager', 'cashier']), updateDebt);
router.post('/:id/cancel', requireMembership(['owner', 'manager', 'cashier']), cancelDebt);

module.exports = router;