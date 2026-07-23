const { z } = require("zod");

const registerSchema = z.object({
  first_name: z
    .string()
    .min(2, "Le prénom doit contenir au moins 2 caractères.")
    .max(100, "Le prénom ne peut pas dépasser 100 caractères."),
  last_name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères.")
    .max(100, "Le nom ne peut pas dépasser 100 caractères."),
  email: z
    .string()
    .email("Email invalide.")
    .max(191, "L'email ne peut pas dépasser 191 caractères."),
  phone: z
    .string()
    .min(8, "Le téléphone doit contenir au moins 8 caractères.")
    .max(30, "Le téléphone ne peut pas dépasser 30 caractères.")
    .optional()
    .nullable(),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères."),
});

const loginSchema = z.object({
  login: z.string().min(1, "Email ou téléphone requis."),
  password: z.string().min(1, "Mot de passe requis."),
});

const updateProfileSchema = z.object({
  first_name: z
    .string()
    .min(2, "Le prénom doit contenir au moins 2 caractères.")
    .max(100, "Le prénom ne peut pas dépasser 100 caractères."),
  last_name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères.")
    .max(100, "Le nom ne peut pas dépasser 100 caractères."),
  phone: z
    .string()
    .min(8, "Le téléphone doit contenir au moins 8 caractères.")
    .max(30, "Le téléphone ne peut pas dépasser 30 caractères.")
    .optional()
    .nullable(),
});

const updatePasswordSchema = z.object({
  current_password: z.string().min(1, "Mot de passe actuel requis."),
  new_password: z
    .string()
    .min(8, "Le nouveau mot de passe doit contenir au moins 8 caractères."),
});

module.exports = { registerSchema, loginSchema, updateProfileSchema, updatePasswordSchema };
