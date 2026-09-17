import { Router, type Response } from "express";
import { Prisma } from "@prisma/client";

import { prisma } from "../lib/prisma";
import { requireAuth } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import {
  createBlendSchema,
  createIssuerSinterFeedMappingSchema,
  createSinterFeedSchema,
  deactivateIssuerSinterFeedMappingSchema,
  idParamsSchema,
  updateBlendSchema,
  updateIssuerSchema,
  updateSinterFeedSchema
} from "../validators/sinter-feed.validator";

const sinterFeedRoutes = Router();
sinterFeedRoutes.use(requireAuth);

const mappingInclude = { issuer: true, sinterFeed: true, blend: true } as const;

const respondNotFound = (res: Response) => {
  res.status(404).json({ message: "Not found" });
};

sinterFeedRoutes.get("/sinter-feeds", async (_req, res) => {
  res.status(200).json(await prisma.sinterFeed.findMany({ orderBy: { code: "asc" } }));
});
sinterFeedRoutes.post("/sinter-feeds", validate(createSinterFeedSchema), async (req, res) => {
  const saved = await prisma.sinterFeed.create({ data: req.body });
  res.status(201).json(saved);
});
sinterFeedRoutes.patch("/sinter-feeds/:id", validate(idParamsSchema, "params"), validate(updateSinterFeedSchema), async (req, res) => {
  try { res.status(200).json(await prisma.sinterFeed.update({ where: { id: res.locals.validatedParams.id }, data: req.body })); }
  catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") { respondNotFound(res); return; } throw error; }
});

sinterFeedRoutes.get("/blends", async (_req, res) => {
  res.status(200).json(await prisma.blend.findMany({ orderBy: { code: "asc" } }));
});
sinterFeedRoutes.post("/blends", validate(createBlendSchema), async (req, res) => {
  const saved = await prisma.blend.create({ data: req.body });
  res.status(201).json(saved);
});
sinterFeedRoutes.patch("/blends/:id", validate(idParamsSchema, "params"), validate(updateBlendSchema), async (req, res) => {
  try { res.status(200).json(await prisma.blend.update({ where: { id: res.locals.validatedParams.id }, data: req.body })); }
  catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") { respondNotFound(res); return; } throw error; }
});

sinterFeedRoutes.get("/issuers", async (_req, res) => {
  res.status(200).json(await prisma.issuer.findMany({ orderBy: { cnpj: "asc" } }));
});
sinterFeedRoutes.patch("/issuers/:id", validate(idParamsSchema, "params"), validate(updateIssuerSchema), async (req, res) => {
  try { res.status(200).json(await prisma.issuer.update({ where: { id: res.locals.validatedParams.id }, data: { descricao: req.body.description } })); }
  catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") { respondNotFound(res); return; } throw error; }
});

sinterFeedRoutes.get("/issuer-sinter-feed-mappings", async (_req, res) => {
  res.status(200).json(await prisma.issuerSinterFeedMapping.findMany({ include: mappingInclude, orderBy: { startsAt: "desc" } }));
});
sinterFeedRoutes.post("/issuer-sinter-feed-mappings", validate(createIssuerSinterFeedMappingSchema), async (req, res) => {
  const startsAt = req.body.startsAt ?? new Date();
  const endsAt = req.body.endsAt ?? null;
  const overlap = await prisma.issuerSinterFeedMapping.findFirst({
    where: {
      issuerId: req.body.issuerId,
      sinterFeedId: req.body.sinterFeedId,
      isActive: true,
      startsAt: { lt: endsAt ?? new Date("9999-12-31T23:59:59.999Z") },
      OR: [{ endsAt: null }, { endsAt: { gt: startsAt } }]
    }
  });
  if (overlap) { res.status(409).json({ message: "An active mapping already overlaps this period" }); return; }
  try {
    const result = await prisma.$transaction(async (tx) => {
      const saved = await tx.issuerSinterFeedMapping.create({ data: { ...req.body, startsAt, endsAt }, include: mappingInclude });
      const backfilled = await tx.record.updateMany({
        where: {
          issuerId: saved.issuerId,
          sinterFeedValue: saved.sinterFeed.code,
          issuerSinterFeedMappingId: null
        },
        data: { issuerSinterFeedMappingId: saved.id }
      });
      return { ...saved, backfilledCount: backfilled.count };
    });
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2002" || error.code === "P2003" || error.code === "P2004")) {
      res.status(409).json({ message: "The mapping conflicts with an active configuration or references unavailable data" });
      return;
    }
    throw error;
  }
});
sinterFeedRoutes.post("/issuer-sinter-feed-mappings/:id/deactivate", validate(idParamsSchema, "params"), validate(deactivateIssuerSinterFeedMappingSchema), async (req, res) => {
  const endsAt = req.body.endsAt ?? new Date();
  const current = await prisma.issuerSinterFeedMapping.findUnique({ where: { id: res.locals.validatedParams.id } });
  if (!current) { respondNotFound(res); return; }
  if (!current.isActive || current.endsAt) { res.status(409).json({ message: "Historical mappings cannot be changed" }); return; }
  if (endsAt < current.startsAt) { res.status(400).json({ message: "endsAt must not be before startsAt" }); return; }
  const result = await prisma.issuerSinterFeedMapping.updateMany({ where: { id: current.id, isActive: true, endsAt: null }, data: { isActive: false, endsAt } });
  if (result.count === 0) { res.status(409).json({ message: "Historical mappings cannot be changed" }); return; }
  const saved = await prisma.issuerSinterFeedMapping.findUnique({ where: { id: current.id }, include: mappingInclude });
  res.status(200).json(saved);
});

export { sinterFeedRoutes };
