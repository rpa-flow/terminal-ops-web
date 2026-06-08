import { z } from "zod";

export const createCatalogSchema = z.object({ name: z.string().trim().min(1).max(120) }).strict();
export const listCatalogQuerySchema = z.object({ page: z.coerce.number().int().min(1).default(1), perPage: z.coerce.number().int().min(1).max(100).default(20), search: z.string().trim().max(120).optional(), isActive: z.enum(["true", "false"]).optional() }).strict().transform((i) => ({...i, isActive: i.isActive ? i.isActive === "true" : undefined}));
export const idParamSchema = z.object({ id: z.string().uuid() }).strict();
