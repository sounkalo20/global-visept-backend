const { z } = require('zod');

const createCompanySchema = z.object({
  name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères.')
    .max(200, 'Le nom ne peut pas dépasser 200 caractères.'),
  description: z
    .string()
    .max(500, 'La description ne peut pas dépasser 500 caractères.')
    .optional()
    .nullable(),
  country: z
    .string()
    .max(100, 'Le pays ne peut pas dépasser 100 caractères.')
    .optional()
    .nullable(),
  city: z
    .string()
    .max(100, 'La ville ne peut pas dépasser 100 caractères.')
    .optional()
    .nullable(),
  address: z
    .string()
    .max(255, "L'adresse ne peut pas dépasser 255 caractères.")
    .optional()
    .nullable(),
  phone: z
    .string()
    .max(30, 'Le téléphone ne peut pas dépasser 30 caractères.')
    .optional()
    .nullable(),
  business_type_id: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val ? parseInt(val, 10) : null))
    .pipe(
      z
        .number()
        .int()
        .min(1, 'Type de business invalide.')
        .max(4, 'Type de business invalide.')
        .optional()
        .nullable()
    ),
});

module.exports = { createCompanySchema };