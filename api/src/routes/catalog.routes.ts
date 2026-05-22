import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { createCatalogSchema, idParamSchema, listCatalogQuerySchema } from "../validators/catalog.validator";

const catalogRoutes = Router();
catalogRoutes.use(requireAuth);

const buildWhere = (query: any) => ({
  ...(query.search ? { name: { contains: query.search, mode: "insensitive" as const } } : {}),
  ...(typeof query.isActive === "boolean" ? { isActive: query.isActive } : {})
});

const listMaterials = async (query: any) => {
  const where = buildWhere(query);
  const skip = (query.page - 1) * query.perPage;
  const [total, items] = await prisma.$transaction([
    prisma.material.count({ where }),
    prisma.material.findMany({ where, orderBy: { name: "asc" }, skip, take: query.perPage })
  ]);
  return { total, items };
};

const listSuppliers = async (query: any) => {
  const where = buildWhere(query);
  const skip = (query.page - 1) * query.perPage;
  const [total, items] = await prisma.$transaction([
    prisma.supplier.count({ where }),
    prisma.supplier.findMany({ where, orderBy: { name: "asc" }, skip, take: query.perPage })
  ]);
  return { total, items };
};

catalogRoutes.get("/materials", validate(listCatalogQuerySchema, "query"), async (_req, res) => {
  const query = res.locals.validatedQuery;
  const result = await listMaterials(query);
  res.status(200).json({ page: query.page, perPage: query.perPage, ...result });
});

catalogRoutes.post("/materials", validate(createCatalogSchema), async (req, res) => {
  const saved = await prisma.material.create({ data: { name: req.body.name } });
  res.status(201).json(saved);
});

catalogRoutes.post("/materials/:id/deactivate", validate(idParamSchema, "params"), async (_req, res) => {
  const updated = await prisma.material.update({ where: { id: res.locals.validatedParams.id }, data: { isActive: false } });
  res.status(200).json(updated);
});

catalogRoutes.get("/suppliers", validate(listCatalogQuerySchema, "query"), async (_req, res) => {
  const query = res.locals.validatedQuery;
  const result = await listSuppliers(query);
  res.status(200).json({ page: query.page, perPage: query.perPage, ...result });
});

catalogRoutes.post("/suppliers", validate(createCatalogSchema), async (req, res) => {
  const saved = await prisma.supplier.create({ data: { name: req.body.name } });
  res.status(201).json(saved);
});

catalogRoutes.post("/suppliers/:id/deactivate", validate(idParamSchema, "params"), async (_req, res) => {
  const updated = await prisma.supplier.update({ where: { id: res.locals.validatedParams.id }, data: { isActive: false } });
  res.status(200).json(updated);
});

export { catalogRoutes };
