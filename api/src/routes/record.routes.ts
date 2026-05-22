import { Router } from "express";
import multer from "multer";
import { parse } from "csv-parse";

import { requireApiKey } from "../middlewares/api-key";
import { requireAuth } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { createRecordService, listRecordsService, updateRecordStatusByNumeroNotaService } from "../services/record.service";
import {
  createRecordSchema,
  csvRowSchema,
  listRecordsQuerySchema,
  updateStatusBodySchema,
  updateStatusParamsSchema
} from "../validators/record.validator";

const recordRoutes = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
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
    const { status, numeroOriginal, idPesagem, idPessagem } = req.body as { status: string; numeroOriginal?: string; idPesagem?: string | number; idPessagem?: string | number };
    const notaPesagemId = idPesagem ?? idPessagem;

    const updated = await updateRecordStatusByNumeroNotaService(numeroNota, status, numeroOriginal, notaPesagemId ? String(notaPesagemId) : undefined);
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
    const { status, numeroOriginal, idPesagem, idPessagem } = req.body as { status: string; numeroOriginal?: string; idPesagem?: string | number; idPessagem?: string | number };
    const notaPesagemId = idPesagem ?? idPessagem;

    const updated = await updateRecordStatusByNumeroNotaService(numeroNota, status, numeroOriginal, notaPesagemId ? String(notaPesagemId) : undefined);
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

  if (rows.length > 500) {
    res.status(400).json({ message: "CSV exceeds the 500 row limit per upload" });
    return;
  }

  let inserted = 0;
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const parsed = csvRowSchema.safeParse(rows[i]);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid data";
      errors.push({ row: i + 2, message });
      continue;
    }
    try {
      await createRecordService(parsed.data);
      inserted += 1;
    } catch {
      errors.push({ row: i + 2, message: "Failed to save record" });
    }
  }

  res.status(207).json({ inserted, errors });
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
