const { z } = require('zod');

const createClientSchema = z.object({
  company_id: z
    .number()
    .int('company_id doit être un nombre entier.')
    .positive('company_id doit être positif.'),
  first_name: z
    .string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères.')
    .max(100, 'Le prénom ne peut pas dépasser 100 caractères.')
    .optional()
    .nullable(),
  last_name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères.')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères.')
    .optional()
    .nullable(),
  phone: z
    .string()
    .min(8, 'Le téléphone doit contenir au moins 8 caractères.')
    .max(30, 'Le téléphone ne peut pas dépasser 30 caractères.'),
  email: z
    .string()
    .email('Email invalide.')
    .max(191, "L'email ne peut pas dépasser 191 caractères.")
    .optional()
    .nullable()
    .or(z.literal('')),
  address: z
    .string()
    .max(255, "L'adresse ne peut pas dépasser 255 caractères.")
    .optional()
    .nullable()
    .or(z.literal('')),
  city: z
    .string()
    .max(100, 'La ville ne peut pas dépasser 100 caractères.')
    .optional()
    .nullable()
    .or(z.literal('')),
  notes: z
    .string()
    .max(1000, 'Les notes ne peuvent pas dépasser 1000 caractères.')
    .optional()
    .nullable()
    .or(z.literal('')),
});

const updateClientSchema = z.object({
  company_id: z
    .number()
    .int('company_id doit être un nombre entier.')
    .positive('company_id doit être positif.'),
  first_name: z
    .string()
    .min(2)
    .max(100)
    .optional()
    .nullable(),
  last_name: z
    .string()
    .min(2)
    .max(100)
    .optional()
    .nullable(),
  phone: z
    .string()
    .min(8)
    .max(30)
    .optional(),
  email: z
    .string()
    .email('Email invalide.')
    .max(191)
    .optional()
    .nullable()
    .or(z.literal('')),
  address: z
    .string()
    .max(255)
    .optional()
    .nullable()
    .or(z.literal('')),
  city: z
    .string()
    .max(100)
    .optional()
    .nullable()
    .or(z.literal('')),
  notes: z
    .string()
    .max(1000)
    .optional()
    .nullable()
    .or(z.literal('')),
  is_active: z
    .boolean()
    .optional(),
});

const bulkClientSchema = z.object({
  ids: z
    .array(z.number().int().positive())
    .min(1, 'Au moins un client doit être sélectionné.'),
  action: z.enum(['activate', 'deactivate', 'change_city', 'delete'], {
    errorMap: () => ({ message: 'Action bulk non supportée pour les clients.' }),
  }),
  params: z
    .object({
      city: z.string().max(100).optional().nullable(),
      reason: z.string().max(500).optional(),
    })
    .optional(),
});

module.exports = { createClientSchema, updateClientSchema, bulkClientSchema };