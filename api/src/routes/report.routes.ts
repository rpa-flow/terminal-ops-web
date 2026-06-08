import { Router } from "express";

import { requireAuth } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { getReportOverviewService } from "../services/report.service";
import { reportOverviewQuerySchema } from "../validators/report.validator";

const reportRoutes = Router();

reportRoutes.use(requireAuth);

reportRoutes.get("/overview", validate(reportOverviewQuerySchema, "query"), async (_req, res) => {
  const query = res.locals.validatedQuery;
  const report = await getReportOverviewService(query);
  res.status(200).json(report);
});

export { reportRoutes };
