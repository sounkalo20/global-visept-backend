const { z } = require('zod');

const createPaymentSchema = z.object({
  company_id: z.number().int().positive('company_id requis.'),
  client_debt_id: z.number().int().positive('client_debt_id requis.'),
  amount: z.number().positive('Le montant doit être supérieur à 0.'),
  payment_method: z.enum(['cash', 'mobile_money', 'bank_transfer', 'other']).default('cash'),
  payment_reference: z.string().max(100).optional().nullable(),
  payment_date: z.string().optional(),
  note: z.string().max(500).optional().nullable(),
});

const updatePaymentSchema = z.object({
  company_id: z.number().int().positive('company_id requis.'),
  amount: z.number().positive('Le montant doit être supérieur à 0.').optional(),
  payment_method: z.enum(['cash', 'mobile_money', 'bank_transfer', 'other']).optional(),
  payment_reference: z.string().max(100).optional().nullable(),
  payment_date: z.string().optional(),
  note: z.string().max(500).optional().nullable(),
});

module.exports = { createPaymentSchema, updatePaymentSchema };