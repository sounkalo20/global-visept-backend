const { z } = require('zod');

const createReturnSchema = z.object({
  company_id: z.number().int().positive(),
  sale_id: z.string().or(z.number()),
  notes: z.string().optional().nullable(),
  items: z.array(
    z.object({
      sale_item_id: z.string().or(z.number()),
      quantity: z.number().positive("La quantité doit être supérieure à 0"),
      return_type: z.enum(['reintegrable', 'defective']),
      reason: z.string().optional().nullable()
    })
  ).min(1, "Au moins un produit doit être retourné.")
});

module.exports = {
  createReturnSchema,
};
