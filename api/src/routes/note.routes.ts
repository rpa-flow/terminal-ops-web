import { Router } from "express";

import { requireAuth } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { createNoteService, listPendingNotesService, updateNoteStatusService } from "../services/note.service";
import {
  createNoteSchema,
  listPendingNotesQuerySchema,
  updateNoteStatusBodySchema,
  updateNoteStatusParamsSchema
} from "../validators/note.validator";

const noteRoutes = Router();

noteRoutes.use(requireAuth);

noteRoutes.post("/", validate(createNoteSchema), async (req, res) => {
  const saved = await createNoteService(req.body);
  res.status(201).json(saved);
});

noteRoutes.get("/pending", validate(listPendingNotesQuerySchema, "query"), async (req, res) => {
  const query = (res.locals.validatedQuery ?? req.query) as { page: number; perPage: number };
  const result = await listPendingNotesService(query);

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
