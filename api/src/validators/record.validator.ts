import { z } from "zod";

const parseDateTime = (value: string): Date | null => {
  const input = value.trim();

  const direct = new Date(input);
  if (!Number.isNaN(direct.getTime())) {
    return direct;
  }

  const isoLike = input.includes("T") ? input : input.replace(" ", "T");
  const normalized = new Date(isoLike);
  if (!Number.isNaN(normalized.getTime())) {
    return normalized;
  }

  const brMatch = input.match(
    /^(\d{2})[\/-](\d{2})[\/-](\d{4})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/
  );

  if (!brMatch) {
    return null;
  }

  const day = Number(brMatch[1]);
  const month = Number(brMatch[2]);
  const year = Number(brMatch[3]);
  const hour = Number(brMatch[4] ?? "0");
  const minute = Number(brMatch[5] ?? "0");
  const second = Number(brMatch[6] ?? "0");

  const candidate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day ||
    candidate.getUTCHours() !== hour ||
    candidate.getUTCMinutes() !== minute ||
    candidate.getUTCSeconds() !== second
  ) {
    return null;
  }

  return candidate;
};

const optionalRecordPesagemIdSchema = z.union([z.string().trim().min(1).max(64), z.number()]).optional();

export const createRecordSchema = z
  .object({
    dataHora: z.string().min(16).max(25),
    nota: z
      .object({
        numero: z.string().trim().min(1).max(64),
        original: z.string().trim().min(1).max(255),
        pesagemId: optionalRecordPesagemIdSchema,
        pesagemid: optionalRecordPesagemIdSchema,
        idPesagem: optionalRecordPesagemIdSchema,
        idPessagem: optionalRecordPesagemIdSchema,
        status: z.string().trim().min(1).max(64)
      })
      .strict(),
    motorista: z
      .object({
        nome: z.string().trim().min(1).max(120),
        celular: z.string().trim().min(1).max(120)
      })
      .strict(),
    veiculo: z
      .object({
        placa: z.string().trim().min(1).max(32)
      })
      .strict(),
    terminal: z.string().trim().min(1).max(120)
  })
  .strict()
  .superRefine((value, ctx) => {
    if (!parseDateTime(value.dataHora)) {
      ctx.addIssue({ code: "custom", message: "Invalid dataHora", path: ["dataHora"] });
    }
  })
  .transform((input) => ({
    dataHora: parseDateTime(input.dataHora) as Date,
    numeroNota: input.nota.numero,
    notaOriginal: input.nota.original,
    status: input.nota.status,
    notaPesagemId: String(input.nota.pesagemId ?? input.nota.pesagemid ?? input.nota.idPesagem ?? input.nota.idPessagem ?? ""),
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
      if (!parseDateTime(value.startDate)) {
        ctx.addIssue({ code: "custom", message: "Invalid startDate", path: ["startDate"] });
      }
    }

    if (value.endDate) {
      if (!parseDateTime(value.endDate)) {
        ctx.addIssue({ code: "custom", message: "Invalid endDate", path: ["endDate"] });
      }
    }
  })
  .transform((input) => ({
    ...input,
    startDate: input.startDate ? (parseDateTime(input.startDate) as Date) : undefined,
    endDate: input.endDate ? (parseDateTime(input.endDate) as Date) : undefined,
    placa: input.placa?.toUpperCase()
  }));

export type CreateRecordInput = z.infer<typeof createRecordSchema>;
export type ListRecordsFilters = z.infer<typeof listRecordsQuerySchema>;

export const updateStatusParamsSchema = z
  .object({
    numeroNota: z.string().trim().min(1).max(64)
  })
  .strict();


const optionalPesagemIdSchema = z.union([z.string().trim().min(1).max(64), z.number()]).optional();

export const updateStatusBodySchema = z
  .object({
    status: z.string().trim().min(1).max(64),
    numeroOriginal: z.string().trim().min(1).max(255).optional(),
    idPesagem: optionalRecordPesagemIdSchema,
    idPessagem: optionalRecordPesagemIdSchema,
    pesagemId: optionalRecordPesagemIdSchema,
    pesagemid: optionalRecordPesagemIdSchema
  })
  .strict()
  .transform((input) => {
    const pesagemId = input.idPesagem ?? input.idPessagem ?? input.pesagemId ?? input.pesagemid;

    return {
      status: input.status,
      numeroOriginal: input.numeroOriginal,
      idPesagem: pesagemId !== undefined ? String(pesagemId) : undefined
    };
  });

export type UpdateStatusParamsInput = z.infer<typeof updateStatusParamsSchema>;
export type UpdateStatusBodyInput = z.infer<typeof updateStatusBodySchema>;

export const csvRowSchema = z
  .object({
    dataHora: z.string().min(16).max(25),
    numeroNota: z.string().trim().min(1).max(64),
    notaOriginal: z.string().trim().min(1).max(255),
    status: z.string().trim().min(1).max(64),
    notaPesagemId: z.string().trim().min(1).max(64),
    motoristaNome: z.string().trim().min(1).max(120),
    motoristaCelular: z.string().trim().min(1).max(120),
    placa: z.string().trim().min(1).max(32),
    terminal: z.string().trim().min(1).max(120)
  })
  .strict()
  .superRefine((row, ctx) => {
    if (!parseDateTime(row.dataHora)) {
      ctx.addIssue({ code: "custom", message: "Invalid dataHora", path: ["dataHora"] });
    }
  })
  .transform((row) => ({
    dataHora: parseDateTime(row.dataHora) as Date,
    numeroNota: row.numeroNota,
    notaOriginal: row.notaOriginal,
    status: row.status,
    notaPesagemId: row.notaPesagemId,
    motoristaNome: row.motoristaNome,
    motoristaCelular: row.motoristaCelular,
    placa: row.placa.toUpperCase(),
    terminal: row.terminal
  }));
