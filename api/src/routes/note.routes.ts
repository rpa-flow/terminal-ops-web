import { Router } from "express";

import { requireAuth } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { createNoteService, listNotesService, updateNoteStatusService } from "../services/note.service";
import {
  createNoteSchema,
  listNotesQuerySchema,
  updateNoteStatusBodySchema,
  updateNoteStatusParamsSchema
} from "../validators/note.validator";

const noteRoutes = Router();

noteRoutes.use(requireAuth);

noteRoutes.post("/", validate(createNoteSchema), async (req, res) => {
  const saved = await createNoteService(req.body);
  res.status(201).json(saved);
});

noteRoutes.get("/", validate(listNotesQuerySchema, "query"), async (req, res) => {
  const query = (res.locals.validatedQuery ?? req.query) as { page: number; perPage: number };
  const result = await listNotesService(query);

  res.status(200).json({
    page: query.page,
    perPage: query.perPage,
    total: result.total,
    items: result.items
  });
});

noteRoutes.patch(
  "/:codigo/status",
  validate(updateNoteStatusParamsSchema, "params"),
  validate(updateNoteStatusBodySchema),
  async (req, res) => {
    const { codigo } = res.locals.validatedParams as { codigo: string };
    const { status } = req.body as { status: string };

    const updated = await updateNoteStatusService(codigo, status);
    if (!updated) {
      res.status(404).json({ message: "Nota not found" });
      return;
    }

    res.status(200).json(updated);
  }
);

export { noteRoutes };
