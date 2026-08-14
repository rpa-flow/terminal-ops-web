import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { createShipmentService, deleteShipmentService, listShipmentsService } from "../services/shipment.service";
import { createShipmentSchema, deleteShipmentParamsSchema, listShipmentsQuerySchema } from "../validators/shipment.validator";

const shipmentRoutes = Router();
shipmentRoutes.use(requireAuth);
shipmentRoutes.get("/", validate(listShipmentsQuerySchema, "query"), async (_req, res) => {
  res.status(200).json(await listShipmentsService(res.locals.validatedQuery));
});
shipmentRoutes.post("/", validate(createShipmentSchema, "body"), async (req, res) => {
  res.status(201).json(await createShipmentService(req.body, req.auth!.userId));
});
shipmentRoutes.delete("/:id", validate(deleteShipmentParamsSchema, "params"), async (_req, res) => {
  const { id } = res.locals.validatedParams as { id: string };
  if (!await deleteShipmentService(id)) {
    res.status(404).json({ message: "Embarque não encontrado." });
    return;
  }
  res.status(200).json({ message: "Embarque excluído com sucesso." });
});
export { shipmentRoutes };
