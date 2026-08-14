const { z } = require("zod");

const createProductSchema = z.object({
  company_id: z
    .number()
    .int("company_id doit être un nombre entier.")
    .positive("company_id doit être un nombre positif."),
  category_id: z.number().int().positive().optional().nullable(),
  unit_id: z.number().int().positive().optional().default(1),
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères.")
    .max(200, "Le nom ne peut pas dépasser 200 caractères."),
  description: z
    .string()
    .max(2000, "La description ne peut pas dépasser 2000 caractères.")
    .optional()
    .nullable(),
  barcode: z
    .string()
    .max(100, "Le code-barres ne peut pas dépasser 100 caractères.")
    .optional()
    .nullable(),
  sku: z
    .string()
    .max(100, "Le SKU ne peut pas dépasser 100 caractères.")
    .optional()
    .nullable(),
  cost_price: z
    .number()
    .min(0, "Le prix de revient doit être positif ou nul.")
    .optional()
    .default(0),
  retail_price: z
    .number()
    .min(0, "Le prix de vente doit être positif ou nul.")
    .optional()
    .default(0),
  wholesale_price: z
    .number()
    .min(0, "Le prix de gros doit être positif ou nul.")
    .optional()
    .default(0),
  wholesale_min_qty: z
    .number()
    .int()
    .min(1, "La quantité minimum pour le prix de gros doit être d'au moins 1.")
    .optional()
    .default(1),
  allow_custom_price: z.boolean().optional().default(false),
  manage_stock: z.coerce.boolean().optional().default(false),
  current_stock: z
    .number()
    .min(0, "Le stock doit être positif ou nul.")
    .optional()
    .default(0),
  low_stock_threshold: z
    .number()
    .min(0, "Le seuil d'alerte doit être positif ou nul.")
    .optional()
    .default(10),
  is_active: z.coerce.boolean().optional().default(true),
  is_available: z.coerce.boolean().optional().default(true),
});

const updateProductSchema = z.object({
  company_id: z
    .number()
    .int("company_id doit être un nombre entier.")
    .positive("company_id doit être un nombre positif."),
  category_id: z.number().int().positive().optional().nullable(),
  unit_id: z.number().int().positive().optional(),
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères.")
    .max(200, "Le nom ne peut pas dépasser 200 caractères.")
    .optional(),
  description: z
    .string()
    .max(2000, "La description ne peut pas dépasser 2000 caractères.")
    .optional()
    .nullable(),
  barcode: z
    .string()
    .max(100, "Le code-barres ne peut pas dépasser 100 caractères.")
    .optional()
    .nullable(),
  sku: z
    .string()
    .max(100, "Le SKU ne peut pas dépasser 100 caractères.")
    .optional()
    .nullable(),
  cost_price: z
    .number()
    .min(0, "Le prix de revient doit être positif ou nul.")
    .optional(),
  retail_price: z
    .number()
    .min(0, "Le prix de vente doit être positif ou nul.")
    .optional(),
  wholesale_price: z
    .number()
    .min(0, "Le prix de gros doit être positif ou nul.")
    .optional(),
  wholesale_min_qty: z
    .number()
    .int()
    .min(1, "La quantité minimum pour le prix de gros doit être d'au moins 1.")
    .optional(),
  allow_custom_price: z.boolean().optional(),
  manage_stock: z.coerce.boolean().optional().default(false),
  current_stock: z
    .number()
    .min(0, "Le stock doit être positif ou nul.")
    .optional(),
  low_stock_threshold: z
    .number()
    .min(0, "Le seuil d'alerte doit être positif ou nul.")
    .optional(),
  is_active: z.coerce.boolean(),
  is_available: z.coerce.boolean(),
});

const updateStockSchema = z.object({
  company_id: z
    .number()
    .int("company_id doit être un nombre entier.")
    .positive("company_id doit être un nombre positif."),
  quantity: z.number().min(0, "La quantité doit être positive ou nulle."),
  movement_type: z.enum(
    ["purchase", "adjustment", "return_customer", "loss", "expiry"],
    {
      errorMap: () => ({ message: "Type de mouvement invalide." }),
    },
  ),
  unit_cost: z.number().min(0).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

const bulkProductSchema = z.object({
  ids: z
    .array(z.number().int().positive())
    .min(1, "Au moins un produit doit être sélectionné."),
  action: z.enum(
    ["activate", "deactivate", "change_category", "toggle_stock_management", "delete"],
    {
      errorMap: () => ({ message: "Action bulk non supportée pour les produits." }),
    }
  ),
  params: z
    .object({
      category_id: z.number().int().positive().optional().nullable(),
      manage_stock: z.boolean().optional(),
      reason: z.string().max(500).optional(),
    })
    .optional(),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  updateStockSchema,
  bulkProductSchema,
};

