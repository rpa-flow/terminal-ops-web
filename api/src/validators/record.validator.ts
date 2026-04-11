import { z } from "zod";

const parseDateTime = (value: string): Date => {
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid date");
  }
  return parsed;
};

export const createRecordSchema = z
  .object({
    dataHora: z.string().min(16).max(25),
    nota: z
      .object({
        numero: z.string().trim().min(1).max(64),
        original: z.string().trim().min(1).max(255),
        status: z.string().trim().min(1).max(64)
      })
      .strict(),
    motorista: z
      .object({
        nome: z.string().trim().min(1).max(120),
        celular: z.string().trim().regex(/^\d{10,13}$/)
      })
      .strict(),
    veiculo: z
      .object({
        placa: z.string().trim().regex(/^[A-Z0-9-]{6,8}$/i)
      })
      .strict(),
    terminal: z.string().trim().min(1).max(120)
  })
  .strict()
  .transform((input) => ({
    dataHora: parseDateTime(input.dataHora),
    numeroNota: input.nota.numero,
    notaOriginal: input.nota.original,
    status: input.nota.status,
    motoristaNome: input.motorista.nome,
    motoristaCelular: input.motorista.celular,
    placa: input.veiculo.placa.toUpperCase(),
    terminal: input.terminal
  }));

export const listRecordsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    perPage: z.coerce.number().int().min(1).max(100).default(20),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    status: z.string().trim().min(1).max(64).optional(),
    motorista: z.string().trim().min(1).max(120).optional(),
    placa: z.string().trim().min(1).max(16).optional(),
    terminal: z.string().trim().min(1).max(120).optional()
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.startDate) {
      try {
        parseDateTime(value.startDate);
      } catch {
        ctx.addIssue({ code: "custom", message: "Invalid startDate", path: ["startDate"] });
      }
    }

    if (value.endDate) {
      try {
        parseDateTime(value.endDate);
      } catch {
        ctx.addIssue({ code: "custom", message: "Invalid endDate", path: ["endDate"] });
      }
    }
  })
  .transform((input) => ({
    ...input,
    startDate: input.startDate ? parseDateTime(input.startDate) : undefined,
    endDate: input.endDate ? parseDateTime(input.endDate) : undefined,
    placa: input.placa?.toUpperCase()
  }));

export type CreateRecordInput = z.infer<typeof createRecordSchema>;
export type ListRecordsFilters = z.infer<typeof listRecordsQuerySchema>;

export const updateStatusParamsSchema = z
  .object({
    numeroNota: z.string().trim().min(1).max(64)
  })
  .strict();

export const updateStatusBodySchema = z
  .object({
    status: z.string().trim().min(1).max(64)
  })
  .strict();

export type UpdateStatusParamsInput = z.infer<typeof updateStatusParamsSchema>;
export type UpdateStatusBodyInput = z.infer<typeof updateStatusBodySchema>;

export const csvRowSchema = z
  .object({
    dataHora: z.string().min(16).max(25),
    numeroNota: z.string().trim().min(1).max(64),
    notaOriginal: z.string().trim().min(1).max(255),
    status: z.string().trim().min(1).max(64),
    motoristaNome: z.string().trim().min(1).max(120),
    motoristaCelular: z.string().trim().regex(/^\d{10,13}$/),
    placa: z.string().trim().regex(/^[A-Z0-9-]{6,8}$/i),
    terminal: z.string().trim().min(1).max(120)
  })
  .strict()
  .transform((row) => ({
    dataHora: parseDateTime(row.dataHora),
    numeroNota: row.numeroNota,
    notaOriginal: row.notaOriginal,
    status: row.status,
    motoristaNome: row.motoristaNome,
    motoristaCelular: row.motoristaCelular,
    placa: row.placa.toUpperCase(),
    terminal: row.terminal
  }));
