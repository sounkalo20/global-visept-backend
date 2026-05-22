const express = require('express');
const router = express.Router();
const { createPayment, getPayments, updatePayment, deletePayment } = require('../controllers/debtPayment.controller');
const authenticate = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { requireMembership } = require('../middlewares/membership.middleware');
const { createPaymentSchema, updatePaymentSchema } = require('../validators/debtPayment.validator');

router.use(authenticate);

router.post('/', validate(createPaymentSchema), requireMembership(['owner', 'manager', 'cashier']), createPayment);
router.get('/', requireMembership(), getPayments);
router.put('/:id', validate(updatePaymentSchema), requireMembership(['owner', 'manager']), updatePayment);
router.delete('/:id', requireMembership(['owner', 'manager']), deletePayment);

module.exports = router;