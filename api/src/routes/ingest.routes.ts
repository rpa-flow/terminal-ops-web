import { Router } from "express";
import rateLimit from "express-rate-limit";

import { rateLimitKeyGenerator, rateLimitValidationConfig } from "../lib/rate-limit";
import { requireApiKey } from "../middlewares/api-key";
import { validate } from "../middlewares/validate";
import { createRecordService, updateRecordStatusByNumeroNotaService } from "../services/record.service";
import { createRecordSchema, updateStatusBodySchema, updateStatusParamsSchema, type UpdateStatusBodyInput } from "../validators/record.validator";

const ingestRoutes = Router();

ingestRoutes.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 600,
    keyGenerator: rateLimitKeyGenerator,
    validate: rateLimitValidationConfig,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests. Try again later." }
  })
);

ingestRoutes.post("/records", requireApiKey, validate(createRecordSchema), async (req, res) => {
  const saved = await createRecordService(req.body);
  res.status(201).json(saved);
});

ingestRoutes.post(
  "/records/:numeroNota/status",
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

ingestRoutes.patch(
  "/records/:numeroNota/status",
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

export { ingestRoutes };