import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { createShipmentService, listShipmentsService } from "../services/shipment.service";
import { createShipmentSchema, listShipmentsQuerySchema } from "../validators/shipment.validator";

const shipmentRoutes = Router();
shipmentRoutes.use(requireAuth);
shipmentRoutes.get("/", validate(listShipmentsQuerySchema, "query"), async (_req, res) => {
  res.status(200).json(await listShipmentsService(res.locals.validatedQuery));
});
shipmentRoutes.post("/", validate(createShipmentSchema, "body"), async (req, res) => {
  res.status(201).json(await createShipmentService(res.locals.validatedBody, req.auth!.userId));
});
export { shipmentRoutes };
