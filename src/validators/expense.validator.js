const { z } = require('zod');

const expenseCategories = [
  'rent', 'salary', 'utility', 'transport', 'maintenance',
  'inventory', 'tax', 'marketing', 'equipment', 'internet',
  'mobile_money_fee', 'bank_fee', 'restaurant_supply', 'salon_supply', 'other',
];

const paymentMethods = ['cash', 'mobile_money', 'bank_transfer', 'check', 'other'];

const createExpenseSchema = z.object({
  company_id: z
    .number()
    .int('company_id doit être un nombre entier.')
    .positive('company_id doit être positif.'),
  title: z
    .string()
    .min(2, 'Le titre doit contenir au moins 2 caractères.')
    .max(200, 'Le titre ne peut pas dépasser 200 caractères.'),
  description: z
    .string()
    .max(2000, 'La description ne peut pas dépasser 2000 caractères.')
    .optional()
    .nullable()
    .or(z.literal('')),
  category: z
    .enum(expenseCategories, {
      errorMap: () => ({ message: `Catégorie invalide. Valeurs possibles : ${expenseCategories.join(', ')}` }),
    }),
  amount: z
    .number()
    .positive('Le montant doit être supérieur à 0.')
    .max(999999999, 'Montant trop élevé.'),
  currency: z
    .string()
    .length(3, 'La devise doit contenir 3 caractères.')
    .default('XOF'),
  payment_method: z
    .enum(paymentMethods, {
      errorMap: () => ({ message: `Méthode de paiement invalide.` }),
    }),
  payment_reference: z
    .string()
    .max(100, 'La référence ne peut pas dépasser 100 caractères.')
    .optional()
    .nullable()
    .or(z.literal('')),
  expense_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide. Utilisez YYYY-MM-DD.'),
  notes: z
    .string()
    .max(1000, 'Les notes ne peuvent pas dépasser 1000 caractères.')
    .optional()
    .nullable()
    .or(z.literal('')),
});

const updateExpenseSchema = z.object({
  company_id: z
    .number()
    .int()
    .positive(),
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(2000).optional().nullable().or(z.literal('')),
  category: z.enum(expenseCategories).optional(),
  amount: z.number().positive('Le montant doit être supérieur à 0.').optional(),
  currency: z.string().length(3).optional(),
  payment_method: z.enum(paymentMethods).optional(),
  payment_reference: z.string().max(100).optional().nullable().or(z.literal('')),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().max(1000).optional().nullable().or(z.literal('')),
});

module.exports = { createExpenseSchema, updateExpenseSchema };