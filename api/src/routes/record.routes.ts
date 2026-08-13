import { Router } from "express";
import multer from "multer";
import { parse } from "csv-parse";

import { requireApiKey } from "../middlewares/api-key";
import { requireAuth } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { createRecordService, importCsvRecordsService, listRecordsService, updateRecordStatusByNumeroNotaService } from "../services/record.service";
import { importCsvNoteService, importCsvNotesService } from "../services/note.service";
import {
  createRecordSchema,
  csvRowSchema,
  listRecordsQuerySchema,
  updateStatusBodySchema,
  updateStatusParamsSchema,
  type UpdateStatusBodyInput
} from "../validators/record.validator";

const recordRoutes = Router();
const CSV_ROW_LIMIT = 50_000;
const CSV_BATCH_SIZE = 500;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!file.originalname.toLowerCase().endsWith(".csv")) {
      cb(new Error("Only CSV files are accepted"));
      return;
    }
    cb(null, true);
  }
});

recordRoutes.post(
  "/:numeroNota/status",
  requireApiKey,
  validate(updateStatusParamsSchema, "params"),
  validate(updateStatusBodySchema),
  async (req, res) => {
    const numeroNota = (res.locals.validatedParams as { numeroNota: string }).numeroNota;
    const { status, numeroOriginal, idPesagem } = req.body as UpdateStatusBodyInput;

    const updated = await updateRecordStatusByNumeroNotaService(numeroNota, status, numeroOriginal, idPesagem);
    if (!updated) {
      res.status(404).json({ message: "Record not found" });
      return;
    }

    res.status(200).json(updated);
  }
);

recordRoutes.patch(
  "/:numeroNota/status",
  requireApiKey,
  validate(updateStatusParamsSchema, "params"),
  validate(updateStatusBodySchema),
  async (req, res) => {
    const numeroNota = (res.locals.validatedParams as { numeroNota: string }).numeroNota;
    const { status, numeroOriginal, idPesagem } = req.body as UpdateStatusBodyInput;

    const updated = await updateRecordStatusByNumeroNotaService(numeroNota, status, numeroOriginal, idPesagem);
    if (!updated) {
      res.status(404).json({ message: "Record not found" });
      return;
    }

    res.status(200).json(updated);
  }
);



recordRoutes.use(requireAuth);

recordRoutes.post("/", validate(createRecordSchema), async (req, res) => {
  const saved = await createRecordService(req.body);
  res.status(201).json(saved);
});

recordRoutes.post("/csv", upload.single("file"), async (req, res) => {
  const destination = typeof req.query.destination === "string" ? req.query.destination.trim().toUpperCase() : "";
  if (destination !== "TBJC" && destination !== "TCS") {
    res.status(400).json({ message: "CSV destination must be TBJC or TCS" });
    return;
  }

  if (!req.file) {
    res.status(400).json({ message: "No CSV file provided" });
    return;
  }

  const fileBuffer = req.file.buffer;

  let rows: Record<string, string>[];
  try {
    rows = await new Promise<Record<string, string>[]>((resolve, reject) => {
      parse(
        fileBuffer,
        {
          columns: true,
          bom: true,
          delimiter: fileBuffer.toString("utf8").split(/\r?\n/, 1)[0]?.includes(";") ? ";" : ",",
          skip_empty_lines: true,
          trim: true
        },
        (error, output) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(output as Record<string, string>[]);
        }
      );
    });
  } catch {
    res.status(400).json({ message: "Invalid CSV format" });
    return;
  }

  if (rows.length === 0) {
    res.status(400).json({ message: "CSV file is empty" });
    return;
  }

  if (rows.length > CSV_ROW_LIMIT) {
    res.status(400).json({ message: `CSV exceeds the ${CSV_ROW_LIMIT} row limit per upload` });
    return;
  }

  const errors: { row: number; message: string }[] = [];
  const noteRows: { row: number; data: Parameters<typeof importCsvNoteService>[0] }[] = [];
  const recordRows: { row: number; data: Parameters<typeof createRecordService>[0] }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const rawRow = rows[i]!;
    const normalizedRow = Object.fromEntries(
      Object.entries(rawRow).map(([header, value]) => {
        const normalizedHeader = header.trim().toLowerCase();
        const headerMap: Record<string, string> = {
          datahora: "dataHora",
          numeronota: "numeroNota",
          "notaoriginal (minerion)": "notaOriginal",
          notaoriginal: "notaOriginal",
          status: "status",
          notapesagemid: "notaPesagemId",
          motoristanome: "motoristaNome",
          motoristacelular: "motoristaCelular",
          placa: "placa",
          terminal: "terminal",
          peso: "peso"
        };

        return [headerMap[normalizedHeader] ?? header.trim(), value];
      })
    );
    const parsed = csvRowSchema.safeParse(normalizedRow);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid data";
      errors.push({ row: i + 2, message });
      continue;
    }
    if (destination === "TCS") {
      noteRows.push({ row: i + 2, data: parsed.data });
    } else {
      recordRows.push({ row: i + 2, data: parsed.data });
    }
  }

  let notes = 0;
  let records = 0;

  for (let offset = 0; offset < noteRows.length; offset += CSV_BATCH_SIZE) {
    const batch = noteRows.slice(offset, offset + CSV_BATCH_SIZE);
    try {
      notes += await importCsvNotesService(batch.map(({ data }) => data));
    } catch {
      for (const item of batch) {
        try {
          await importCsvNoteService(item.data);
          notes += 1;
        } catch {
          errors.push({ row: item.row, message: "Failed to save CSV row" });
        }
      }
    }
  }

  for (let offset = 0; offset < recordRows.length; offset += CSV_BATCH_SIZE) {
    const batch = recordRows.slice(offset, offset + CSV_BATCH_SIZE);
    try {
      records += await importCsvRecordsService(batch.map(({ data }) => data));
    } catch {
      for (const item of batch) {
        try {
          await createRecordService(item.data);
          records += 1;
        } catch {
          errors.push({ row: item.row, message: "Failed to save CSV row" });
        }
      }
    }
  }

  res.status(207).json({ inserted: notes + records, destinations: { notes, records }, errors });
});

recordRoutes.get("/", validate(listRecordsQuerySchema, "query"), async (req, res) => {
  const query = (res.locals.validatedQuery ?? req.query) as never;
  const result = await listRecordsService(query);
  res.status(200).json({
    page: Number((query as Record<string, unknown>).page),
    perPage: Number((query as Record<string, unknown>).perPage),
    total: result.total,
    items: result.items
  });
});

export { recordRoutes };
