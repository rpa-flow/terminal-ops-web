import { http } from "./http";

export type CatalogItem = { id: string; name: string; isActive: boolean };
export type CatalogListResponse = { page: number; perPage: number; total: number; items: CatalogItem[] };

export const listMaterialsRequest = (token: string, query: Record<string, string | number | undefined>) => http<CatalogListResponse>("/catalog/materials", { token, query });
export const createMaterialRequest = (token: string, name: string) => http<CatalogItem>("/catalog/materials", { method: "POST", token, body: { name } });
export const deactivateMaterialRequest = (token: string, id: string) => http<CatalogItem>(`/catalog/materials/${id}/deactivate`, { method: "POST", token });

export const listSuppliersRequest = (token: string, query: Record<string, string | number | undefined>) => http<CatalogListResponse>("/catalog/suppliers", { token, query });
export const createSupplierRequest = (token: string, name: string) => http<CatalogItem>("/catalog/suppliers", { method: "POST", token, body: { name } });
export const deactivateSupplierRequest = (token: string, id: string) => http<CatalogItem>(`/catalog/suppliers/${id}/deactivate`, { method: "POST", token });
