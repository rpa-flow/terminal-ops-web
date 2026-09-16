import { z } from "zod";

const optionalDescription = z.string().trim().min(1).max(255).optional().nullable();

export const idParamsSchema = z.object({ id: z.string().uuid() }).strict();
export const createSinterFeedSchema = z.object({ code: z.string().trim().min(1).max(120), description: optionalDescription, isActive: z.boolean().default(true) }).strict().transform((input) => ({ ...input, code: input.code.toUpperCase() }));
export const updateSinterFeedSchema = z.object({ description: optionalDescription, isActive: z.boolean().optional() }).strict();
export const createBlendSchema = z.object({ code: z.string().trim().min(1).max(32), description: optionalDescription, isActive: z.boolean().default(true) }).strict().transform((input) => ({ ...input, code: input.code.toUpperCase() }));
export const updateBlendSchema = z.object({ description: optionalDescription, isActive: z.boolean().optional() }).strict();
export const updateIssuerSchema = z.object({ description: optionalDescription }).strict();

export const createIssuerSinterFeedMappingSchema = z.object({
  issuerId: z.string().uuid(),
  sinterFeedId: z.string().uuid(),
  blendId: z.string().uuid(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional().nullable(),
  isActive: z.boolean().default(true)
}).strict().superRefine((value, ctx) => {
  if (value.endsAt && value.startsAt && value.endsAt < value.startsAt) {
    ctx.addIssue({ code: "custom", message: "endsAt must not be before startsAt", path: ["endsAt"] });
  }
});

export const deactivateIssuerSinterFeedMappingSchema = z.object({ endsAt: z.coerce.date().optional() }).strict();
