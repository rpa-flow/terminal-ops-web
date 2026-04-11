import { Router } from "express";
import rateLimit from "express-rate-limit";

import { requireApiKey } from "../middlewares/api-key";
import { validate } from "../middlewares/validate";
import { createRecordService } from "../services/record.service";
import { createRecordSchema } from "../validators/record.validator";

const ingestRoutes = Router();

ingestRoutes.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 600,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests. Try again later." }
  })
);

ingestRoutes.post("/records", requireApiKey, validate(createRecordSchema), async (req, res) => {
  const saved = await createRecordService(req.body);
  res.status(201).json(saved);
});

export { ingestRoutes };