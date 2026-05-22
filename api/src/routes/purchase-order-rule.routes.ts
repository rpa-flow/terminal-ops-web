import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import {
  createPurchaseOrderRuleService,
  deactivatePurchaseOrderRuleService,
  DuplicatePurchaseOrderRuleError,
  listPurchaseOrderRulesService,
  updatePurchaseOrderRuleService
} from "../services/purchase-order-rule.service";
import { createPurchaseOrderRuleSchema, listPurchaseOrderRulesQuerySchema, purchaseOrderRuleIdParamsSchema, updatePurchaseOrderRuleSchema } from "../validators/purchase-order-rule.validator";

const purchaseOrderRuleRoutes = Router();
purchaseOrderRuleRoutes.use(requireAuth);

purchaseOrderRuleRoutes.post("/", validate(createPurchaseOrderRuleSchema), async (req, res) => {
  try {
    const saved = await createPurchaseOrderRuleService(req.body, req.auth!.userId);
    res.status(201).json(saved);
  } catch (e) {
    if (e instanceof DuplicatePurchaseOrderRuleError) {
      res.status(409).json({ message: "Já existe uma configuração para este Material e Fornecedor" });
      return;
    }
    throw e;
  }
});
purchaseOrderRuleRoutes.get("/", validate(listPurchaseOrderRulesQuerySchema, "query"), async (_req, res) => {
  const query = res.locals.validatedQuery;
  const result = await listPurchaseOrderRulesService(query);
  res.status(200).json({ page: query.page, perPage: query.perPage, total: result.total, items: result.items });
});
purchaseOrderRuleRoutes.patch("/:id", validate(purchaseOrderRuleIdParamsSchema, "params"), validate(updatePurchaseOrderRuleSchema), async (req, res) => {
  const { id } = res.locals.validatedParams;
  const updated = await updatePurchaseOrderRuleService(id, req.body, req.auth!.userId);
  if (!updated) { res.status(404).json({ message: "Rule not found" }); return; }
  res.status(200).json(updated);
});
purchaseOrderRuleRoutes.post("/:id/deactivate", validate(purchaseOrderRuleIdParamsSchema, "params"), async (_req, res) => {
  const { id } = res.locals.validatedParams;
  const updated = await deactivatePurchaseOrderRuleService(id, res.req.auth!.userId);
  if (!updated) { res.status(404).json({ message: "Rule not found" }); return; }
  res.status(200).json(updated);
});

export { purchaseOrderRuleRoutes };
