import { Prisma } from "@prisma/client";
import xss from "xss";
import {
  createPurchaseOrderRule,
  createPurchaseOrderRuleHistory,
  findActiveRule,
  findPurchaseOrderRuleById,
  listPurchaseOrderRules,
  updatePurchaseOrderRule
} from "../repositories/purchase-order-rule.repository";
import type { CreatePurchaseOrderRuleInput, ListPurchaseOrderRulesFilters, UpdatePurchaseOrderRuleInput } from "../validators/purchase-order-rule.validator";

const sanitize = (v: string | null) => (v ? xss(v, { whiteList: {} }) : v);
const sanitizeRule = (r: any) => ({ ...r, materialId: sanitize(r.materialId), supplierId: sanitize(r.supplierId), purchaseOrderCode: sanitize(r.purchaseOrderCode), purchaseOrderType: sanitize(r.purchaseOrderType), description: sanitize(r.description), lot: sanitize(r.lot), costCenter: sanitize(r.costCenter), paymentCondition: sanitize(r.paymentCondition), currency: sanitize(r.currency), unit: sanitize(r.unit) });

export class DuplicatePurchaseOrderRuleError extends Error {}

const createHistory = (purchaseOrderRuleId: string, userId: string, action: string, beforeData: unknown, afterData: unknown) =>
  createPurchaseOrderRuleHistory({ purchaseOrderRuleId, userId, action, beforeData: beforeData as Prisma.JsonObject, afterData: afterData as Prisma.JsonObject });

export const createPurchaseOrderRuleService = async (input: CreatePurchaseOrderRuleInput, userId: string) => {
  try {
    const saved = await createPurchaseOrderRule({ ...input, description: input.description ?? null, lot: input.lot ?? null, minimumQuantity: input.minimumQuantity ?? null, costCenter: input.costCenter ?? null, paymentCondition: input.paymentCondition ?? null, currency: input.currency ?? null, unit: input.unit ?? null, createdBy: userId, updatedBy: userId });
    await createHistory(saved.id, userId, "CREATE", null, saved as unknown as Prisma.JsonObject);
    return sanitizeRule(saved);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new DuplicatePurchaseOrderRuleError();
    throw error;
  }
};

export const updatePurchaseOrderRuleService = async (id: string, input: UpdatePurchaseOrderRuleInput, userId: string) => {
  const current = await findPurchaseOrderRuleById(id);
  if (!current) return null;
  const patch = Object.fromEntries(Object.entries(input).filter(([,v]) => v !== undefined));
  const updated = await updatePurchaseOrderRule(id, { ...patch, updatedBy: userId });
  await createHistory(id, userId, "UPDATE", current as unknown as Prisma.JsonObject, updated as unknown as Prisma.JsonObject);
  return sanitizeRule(updated);
};

export const deactivatePurchaseOrderRuleService = async (id: string, userId: string) => {
  const current = await findPurchaseOrderRuleById(id);
  if (!current) return null;
  const updated = await updatePurchaseOrderRule(id, { isActive: false, updatedBy: userId });
  await createHistory(id, userId, "DEACTIVATE", current as unknown as Prisma.JsonObject, updated as unknown as Prisma.JsonObject);
  return sanitizeRule(updated);
};

export const listPurchaseOrderRulesService = async (filters: ListPurchaseOrderRulesFilters) => {
  const result = await listPurchaseOrderRules(filters);
  return { ...result, items: result.items.map(sanitizeRule) };
};

export const resolvePurchaseOrder = async (materialId: string, supplierId: string) => {
  const rule = await findActiveRule(materialId, supplierId);
  if (!rule) return null;
  return { purchaseOrderCode: rule.purchaseOrderCode, purchaseOrderType: rule.purchaseOrderType, lot: rule.lot, costCenter: rule.costCenter };
};
