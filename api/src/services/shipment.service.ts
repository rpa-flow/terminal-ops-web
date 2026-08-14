import { Prisma } from "@prisma/client";
import xss from "xss";

import { prisma } from "../lib/prisma";
import type { CreateShipmentInput, ListShipmentsInput } from "../validators/shipment.validator";

const clean = (value: string | null) => value === null ? null : xss(value, { whiteList: {} });

export const createShipmentService = async (input: CreateShipmentInput, userId: string) => {
  const shipment = await prisma.shipment.create({ data: {
    terminal: input.terminal,
    shippedAt: input.shippedAt,
    volume: input.volume,
    destination: input.destination ?? null,
    document: input.document ?? null,
    notes: input.notes ?? null,
    createdBy: userId
  } });
  return { ...shipment, volume: shipment.volume.toNumber(), destination: clean(shipment.destination), document: clean(shipment.document), notes: clean(shipment.notes) };
};

export const listShipmentsService = async (filters: ListShipmentsInput) => {
  const dateFilter: Prisma.DateTimeFilter<"Shipment"> = {};
  if (filters.startDate) dateFilter.gte = filters.startDate;
  if (filters.endDate) dateFilter.lte = filters.endDate;
  const where: Prisma.ShipmentWhereInput = {
    terminal: filters.terminal,
    ...(filters.startDate || filters.endDate ? { shippedAt: dateFilter } : {})
  };
  const [items, shippedAggregate, receivedRecords] = await prisma.$transaction([
    prisma.shipment.findMany({ where, orderBy: { shippedAt: "desc" }, take: 200 }),
    prisma.shipment.aggregate({ where, _sum: { volume: true } }),
    prisma.record.findMany({
      where: { terminal: { contains: filters.terminal, mode: "insensitive" }, recebimentoPeso: { not: null } },
      select: { recebimentoPeso: true }
    })
  ]);
  const receivedVolume = receivedRecords.reduce((total, item) => {
    const normalized = item.recebimentoPeso?.replace(/\./g, "").replace(",", ".") ?? "0";
    const value = Number(normalized.replace(/[^0-9.-]/g, ""));
    return total + (Number.isFinite(value) ? value : 0);
  }, 0);
  const shippedVolume = shippedAggregate._sum.volume?.toNumber() ?? 0;
  return {
    summary: { receivedVolume, shippedVolume, availableVolume: receivedVolume - shippedVolume },
    items: items.map((item) => ({ ...item, volume: item.volume.toNumber(), destination: clean(item.destination), document: clean(item.document), notes: clean(item.notes) }))
  };
};

export const deleteShipmentService = async (id: string) => {
  const result = await prisma.shipment.deleteMany({ where: { id } });
  return result.count > 0;
};
