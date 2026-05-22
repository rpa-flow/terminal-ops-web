import { z } from "zod";

const optionalText = (max: number) => z.string().trim().min(1).max(max).optional();

export const createPurchaseOrderRuleSchema = z.object({
  materialId: z.string().trim().min(1).max(64),
  supplierId: z.string().trim().min(1).max(64),
  purchaseOrderCode: z.string().trim().min(1).max(64),
  purchaseOrderType: z.string().trim().min(1).max(32),
  description: optionalText(255),
  lot: optionalText(64),
  minimumQuantity: z.coerce.number().positive().optional(),
  costCenter: optionalText(64),
  paymentCondition: optionalText(64),
  currency: optionalText(16),
  unit: optionalText(16),
  isActive: z.boolean().default(true)
}).strict();

export const updatePurchaseOrderRuleSchema = createPurchaseOrderRuleSchema.partial().strict();

export const listPurchaseOrderRulesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  materialId: z.string().trim().min(1).max(64).optional(),
  supplierId: z.string().trim().min(1).max(64).optional(),
  isActive: z.enum(["true", "false"]).optional()
}).strict().transform((i) => ({...i, isActive: i.isActive ? i.isActive === "true" : undefined}));

export const purchaseOrderRuleIdParamsSchema = z.object({ id: z.string().uuid() }).strict();

export type CreatePurchaseOrderRuleInput = z.infer<typeof createPurchaseOrderRuleSchema>;
export type UpdatePurchaseOrderRuleInput = z.infer<typeof updatePurchaseOrderRuleSchema>;
export type ListPurchaseOrderRulesFilters = z.infer<typeof listPurchaseOrderRulesQuerySchema>;
