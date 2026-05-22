import { http } from "./http";

export type PurchaseOrderRule = { id: string; materialId: string; supplierId: string; purchaseOrderCode: string; purchaseOrderType: string; description?: string; lot?: string; minimumQuantity?: number; costCenter?: string; paymentCondition?: string; isActive: boolean; };
export type PurchaseOrderRulesResponse = { page: number; perPage: number; total: number; items: PurchaseOrderRule[] };

export const listPurchaseOrderRulesRequest = (token: string, query: Record<string, string | number | undefined>) =>
  http<PurchaseOrderRulesResponse>("/purchase-order-rules", { token, query });
export const createPurchaseOrderRuleRequest = (token: string, body: Record<string, unknown>) => http<PurchaseOrderRule>("/purchase-order-rules", { method: "POST", token, body });
export const updatePurchaseOrderRuleRequest = (token: string, id: string, body: Record<string, unknown>) => http<PurchaseOrderRule>(`/purchase-order-rules/${id}`, { method: "PATCH", token, body });
export const deactivatePurchaseOrderRuleRequest = (token: string, id: string) => http<PurchaseOrderRule>(`/purchase-order-rules/${id}/deactivate`, { method: "POST", token });
