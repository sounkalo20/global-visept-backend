const { z } = require("zod");

const salePaymentItemSchema = z.object({
  method: z.enum(["cash", "mobile_money", "bank_transfer", "card", "other"]).default("cash"),
  amount: z.number().min(0, "Le montant du paiement ne peut pas être négatif."),
  reference: z.string().max(100).optional().nullable(),
});

const saleItemSchema = z.object({
  product_id: z
    .number()
    .int("product_id doit être un nombre entier.")
    .positive("product_id doit être positif."),
  variant_id: z.number().int().positive().optional().nullable(),
  quantity: z
    .number()
    .positive("La quantité doit être supérieure à 0.")
    .max(999999, "Quantité trop élevée."),
  unit_price: z.number().min(0, "Le prix unitaire ne peut pas être négatif."),
  price_type: z.enum(["retail", "wholesale", "custom"]).default("retail"),
  discount_amount: z
    .number()
    .min(0, "La remise ne peut pas être négative.")
    .optional()
    .default(0),
  notes: z.string().max(500, "Notes trop longues.").optional().nullable(),
});

const createSaleSchema = z.object({
  company_id: z
    .number()
    .int("company_id doit être un nombre entier.")
    .positive("company_id doit être positif."),
  client_id: z.number().int().positive().optional().nullable(),
  client_name: z
    .string()
    .max(200, "Le nom du client est trop long.")
    .optional()
    .nullable(),
  items: z.array(saleItemSchema).min(1, "Au moins un article est requis."),
  discount_type: z.enum(["none", "percentage", "fixed"]).default("none"),
  discount_value: z.number().min(0).optional().nullable(),
  payment_status: z.enum(["paid", "partial", "unpaid", "debt"]).default("paid"),
  amount_paid: z.number().min(0).optional().default(0),
  payment_method: z
    .enum(["cash", "mobile_money", "bank_transfer", "card", "other"])
    .default("cash"),
  payment_reference: z.string().max(100).optional().nullable(),
  payments: z.array(salePaymentItemSchema).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  
  // Champs optionnels Mode Hors-Ligne & Audit
  offline_uuid: z.string().uuid("offline_uuid doit être un UUID valide.").optional().nullable(),
  device_id: z.string().max(64).optional().nullable(),
  is_offline_sync: z.boolean().optional().default(false),
  offline_created_at: z.string().optional().nullable(),
});

const updateSaleSchema = z.object({
  company_id: z
    .number()
    .int("company_id doit être un nombre entier.")
    .positive("company_id doit être positif."),
  client_id: z.number().int().positive().optional().nullable(),
  client_name: z.string().max(200).optional().nullable(),
  items: z
    .array(saleItemSchema)
    .min(1, "Au moins un article est requis.")
    .optional(),
  discount_type: z.enum(["none", "percentage", "fixed"]).optional(),
  discount_value: z.number().min(0).optional().nullable(),
  payment_status: z.enum(["paid", "partial", "unpaid", "debt"]).optional(),
  amount_paid: z.number().min(0).optional(),
  payment_method: z
    .enum(["cash", "mobile_money", "bank_transfer", "card", "other"])
    .optional(),
  payment_reference: z.string().max(100).optional().nullable(),
  payments: z.array(salePaymentItemSchema).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

module.exports = { createSaleSchema, updateSaleSchema };
