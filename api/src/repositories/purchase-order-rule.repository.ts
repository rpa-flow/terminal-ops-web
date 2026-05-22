import type { Prisma, PurchaseOrderRule } from "@prisma/client";
import { prisma } from "../lib/prisma";
import type { CreatePurchaseOrderRuleInput, ListPurchaseOrderRulesFilters, UpdatePurchaseOrderRuleInput } from "../validators/purchase-order-rule.validator";

const whereFromFilters = (f: ListPurchaseOrderRulesFilters): Prisma.PurchaseOrderRuleWhereInput => ({
  ...(f.materialId ? { materialId: { contains: f.materialId, mode: "insensitive" } } : {}),
  ...(f.supplierId ? { supplierId: { contains: f.supplierId, mode: "insensitive" } } : {}),
  ...(typeof f.isActive === "boolean" ? { isActive: f.isActive } : {})
});

export const createPurchaseOrderRule = (data: Prisma.PurchaseOrderRuleUncheckedCreateInput) => prisma.purchaseOrderRule.create({ data });
export const findPurchaseOrderRuleById = (id: string) => prisma.purchaseOrderRule.findUnique({ where: { id } });
export const updatePurchaseOrderRule = (id: string, data: Prisma.PurchaseOrderRuleUncheckedUpdateInput) => prisma.purchaseOrderRule.update({ where: { id }, data });
export const createPurchaseOrderRuleHistory = (data: Prisma.PurchaseOrderRuleHistoryUncheckedCreateInput) => prisma.purchaseOrderRuleHistory.create({ data });
export const findActiveRule = (materialId: string, supplierId: string): Promise<PurchaseOrderRule | null> => prisma.purchaseOrderRule.findFirst({ where: { materialId, supplierId, isActive: true } });

export const listPurchaseOrderRules = async (filters: ListPurchaseOrderRulesFilters) => {
  const where = whereFromFilters(filters);
  const skip = (filters.page - 1) * filters.perPage;
  const [total, items] = await prisma.$transaction([
    prisma.purchaseOrderRule.count({ where }),
    prisma.purchaseOrderRule.findMany({ where, orderBy: { updatedAt: "desc" }, skip, take: filters.perPage })
  ]);
  return { total, items };
};
