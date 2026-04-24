import { z } from "zod";

const notaCodigoSchema = z
  .string()
  .trim()
  .regex(/^\d{44}$/, "codigo deve conter exatamente 44 digitos");

export const createNoteSchema = z
  .object({
    codigo: notaCodigoSchema,
    terminal: z.string().trim().min(1).max(120)
  })
  .strict();

export const updateNoteStatusParamsSchema = z
  .object({
    codigo: notaCodigoSchema
  })
  .strict();

export const updateNoteStatusBodySchema = z
  .object({
    status: z.string().trim().min(1).max(64)
  })
  .strict();

export const listPendingNotesQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    perPage: z.coerce.number().int().min(1).max(100).default(20)
  })
  .strict();

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteStatusParamsInput = z.infer<typeof updateNoteStatusParamsSchema>;
export type UpdateNoteStatusBodyInput = z.infer<typeof updateNoteStatusBodySchema>;
export type ListPendingNotesQueryInput = z.infer<typeof listPendingNotesQuerySchema>;
