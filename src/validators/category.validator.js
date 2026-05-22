const { z } = require('zod');

const createCategorySchema = z.object({
  company_id: z
    .number()
    .int('company_id doit être un nombre entier.')
    .positive('company_id doit être un nombre positif.'),
  name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères.')
    .max(200, 'Le nom ne peut pas dépasser 200 caractères.'),
  description: z
    .string()
    .max(500, 'La description ne peut pas dépasser 500 caractères.')
    .optional()
    .nullable(),
  parent_id: z
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),
  sort_order: z
    .number()
    .int()
    .min(0)
    .optional()
    .default(0),
  is_active: z
    .boolean()
    .optional()
    .default(true),
});

const updateCategorySchema = z.object({
  company_id: z
    .number()
    .int('company_id doit être un nombre entier.')
    .positive('company_id doit être un nombre positif.'),
  name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères.')
    .max(200, 'Le nom ne peut pas dépasser 200 caractères.')
    .optional(),
  description: z
    .string()
    .max(500, 'La description ne peut pas dépasser 500 caractères.')
    .optional()
    .nullable(),
  parent_id: z
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),
  sort_order: z
    .number()
    .int()
    .min(0)
    .optional(),
  is_active: z
    .boolean()
    .optional(),
});

module.exports = { createCategorySchema, updateCategorySchema };