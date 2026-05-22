const { z } = require('zod');

const saleItemSchema = z.object({
  product_id: z.number().int().positive('product_id requis.'),
  quantity: z.number().positive('Quantité > 0.'),
  unit_price: z.number().min(0, 'Prix >= 0.'),
  price_type: z.enum(['retail', 'wholesale', 'custom']).optional().default('retail'),
});

const createDebtSchema = z.object({
  company_id: z.number().int().positive('company_id requis.'),
  client_id: z.number().int().positive('client_id requis.').optional().nullable(),
  client_name: z.string().max(200).optional().nullable(),
  items: z.array(saleItemSchema).min(1, 'Au moins un article requis.'),
  discount_type: z.enum(['none', 'percentage', 'fixed']).optional().default('none'),
  discount_value: z.number().min(0).optional().default(0),
  amount_paid: z.number().min(0).optional().default(0),
  payment_method: z.enum(['cash', 'mobile_money', 'bank_transfer', 'other']).optional().default('cash'),
  payment_reference: z.string().max(100).optional().nullable(),
  due_date: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

const updateDebtSchema = z.object({
  company_id: z.number().int().positive('company_id requis.'),
  total_amount: z.number().positive().optional(),
  due_date: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  status: z.enum(['pending', 'partial', 'paid', 'overdue', 'canceled']).optional(),
  items: z.array(saleItemSchema).optional(), // permet de modifier les articles
  discount_type: z.enum(['none', 'percentage', 'fixed']).optional(),
  discount_value: z.number().min(0).optional(),
});

module.exports = { createDebtSchema, updateDebtSchema };