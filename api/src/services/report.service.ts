import { Prisma } from "@prisma/client";

import { prisma } from "../lib/prisma";
import type { ReportOverviewQueryInput } from "../validators/report.validator";

type BreakdownItem = {
  label: string;
  total: number;
};

type DailyVolumeItem = {
  date: string;
  emittedNotes: number;
  receivedRecords: number;
};

type DailyReceivedWeightItem = {
  date: string;
  totalWeight: number;
};

type PileBalanceItem = {
  pile: string;
  received: number;
  shipped: number;
  balance: number;
};

type DailySinterFeedWeightItem = {
  date: string;
  totalWeight: number;
  weights: { code: string; totalWeight: number }[];
};

type BlendBalanceItem = {
  blend: string;
  received: number;
  shipped: number;
  balance: number;
};

type PendingNoteItem = {
  codigo: string;
  terminal: string;
  placa: string | null;
  motoristaNome: string | null;
  status: string;
  createdAt: Date;
  ageHours: number;
};

type CountRow = {
  count: number | bigint;
};

type AverageRow = {
  averageHours: number | string | null;
};

const toNumber = (value: number | bigint | string | null | undefined): number => {
  if (typeof value === "bigint") {
    return Number(value);
  }

  if (typeof value === "string") {
    return Number(value);
  }

  return value ?? 0;
};

const percentage = (part: number, total: number): number => {
  if (total === 0) {
    return 0;
  }

  return Number(((part / total) * 100).toFixed(1));
};

const buildRecordWhere = (filters: ReportOverviewQueryInput): Prisma.RecordWhereInput => {
  // Data/Hora is the operational date shown on the records screen. createdAt is
  // only the ingestion timestamp and can fall on a later day after a CSV import.
  const terminal = filters.terminal?.trim().toUpperCase();
  return {
    dataHora: {
      gte: filters.startDate,
      lte: filters.endDate
    },
    ...(terminal === "TBJC"
      ? { OR: ["TBJC", "TJBC"].map((value) => ({ terminal: { contains: value, mode: "insensitive" as const } })) }
      : terminal ? { terminal: { contains: terminal, mode: "insensitive" } } : {})
  };
};

const buildNoteWhere = (filters: ReportOverviewQueryInput): Prisma.NoteWhereInput => {
  const where: Prisma.NoteWhereInput = {
    OR: [
      {
        dataHora: {
          gte: filters.startDate,
          lte: filters.endDate
        }
      },
      {
        dataHora: null,
        createdAt: {
          gte: filters.startDate,
          lte: filters.endDate
        }
      }
    ]
  };

  return where;
};

const normalizeBreakdown = <T extends { _count: { _all: number } }>(
  rows: T[],
  labelSelector: (row: T) => string | null
): BreakdownItem[] =>
  rows
    .map((row) => ({ label: labelSelector(row) || "Nao informado", total: row._count._all }))
    .sort((a, b) => b.total - a.total);

const dateKey = (value: Date): string => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
};

const parseWeight = (value: string | null): number => {
  if (!value) return 0;

  const normalized = value.replace(/\./g, "").replace(",", ".").replace(/[^0-9.-]/g, "");
  const weight = Number(normalized);
  return Number.isFinite(weight) ? weight : 0;
};

const parseValidWeight = (value: string | null): number | null => {
  if (!value?.trim()) return null;
  const normalized = value.replace(/\./g, "").replace(",", ".").replace(/[^0-9.-]/g, "");
  const weight = Number(normalized);
  return Number.isFinite(weight) ? weight : null;
};

const buildDateKeys = (startDate: Date, endDate: Date): string[] => {
  const keys: string[] = [];
  const cursor = new Date(`${dateKey(startDate)}T12:00:00.000Z`);
  const last = new Date(`${dateKey(endDate)}T12:00:00.000Z`);
  while (cursor <= last && keys.length < 366) {
    keys.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return keys;
};

const buildDailySinterFeedWeights = (
  startDate: Date,
  endDate: Date,
  codes: string[],
  receipts: { dataHora: Date; recebimentoPeso: string | null; issuerSinterFeedMapping: { sinterFeed: { code: string } } | null }[]
): DailySinterFeedWeightItem[] => {
  const buckets = new Map<string, Map<string, number>>();
  buildDateKeys(startDate, endDate).forEach((key) => buckets.set(key, new Map()));
  receipts.forEach((receipt) => {
    const weight = parseValidWeight(receipt.recebimentoPeso);
    const code = receipt.issuerSinterFeedMapping?.sinterFeed.code;
    const bucket = buckets.get(dateKey(receipt.dataHora));
    if (weight === null || !code || !bucket) return;
    bucket.set(code, (bucket.get(code) ?? 0) + weight);
  });
  return Array.from(buckets, ([date, weights]) => ({
    date,
    totalWeight: Number(Array.from(weights.values()).reduce((total, value) => total + value, 0).toFixed(3)),
    weights: codes.map((code) => ({ code, totalWeight: Number((weights.get(code) ?? 0).toFixed(3)) }))
  }));
};

const buildBlendBalances = (
  receipts: { recebimentoPeso: string | null; issuerSinterFeedMapping: { blend: { code: string } } | null }[],
  shipments: { volume: Prisma.Decimal; blend: { code: string } | null }[],
  blendCodes: string[]
): BlendBalanceItem[] => {
  const balances = new Map(blendCodes.map((code) => [code, { received: 0, shipped: 0 }]));
  receipts.forEach((receipt) => {
    const weight = parseValidWeight(receipt.recebimentoPeso);
    const blend = receipt.issuerSinterFeedMapping?.blend.code;
    if (weight === null || !blend) return;
    const current = balances.get(blend) ?? { received: 0, shipped: 0 };
    current.received += weight;
    balances.set(blend, current);
  });
  shipments.forEach((shipment) => {
    if (!shipment.blend) return;
    const current = balances.get(shipment.blend.code) ?? { received: 0, shipped: 0 };
    current.shipped += shipment.volume.toNumber();
    balances.set(shipment.blend.code, current);
  });
  return Array.from(balances, ([blend, values]) => ({
    blend,
    received: Number(values.received.toFixed(3)),
    shipped: Number(values.shipped.toFixed(3)),
    balance: Number((values.received - values.shipped).toFixed(3))
  })).sort((left, right) => left.blend.localeCompare(right.blend));
};

const buildPileBalances = (
  receipts: { recebimentoPatioDescarga: string | null; recebimentoPeso: string | null }[],
  shipments: { pile: string | null; volume: Prisma.Decimal }[]
): PileBalanceItem[] => {
  const balances = new Map<string, { received: number; shipped: number }>();

  receipts.forEach((receipt) => {
    const pile = receipt.recebimentoPatioDescarga?.trim() || "Não informada";
    const current = balances.get(pile) ?? { received: 0, shipped: 0 };
    current.received += parseWeight(receipt.recebimentoPeso);
    balances.set(pile, current);
  });

  shipments.forEach((shipment) => {
    const pile = shipment.pile?.trim() || "Não informada";
    const current = balances.get(pile) ?? { received: 0, shipped: 0 };
    current.shipped += shipment.volume.toNumber();
    balances.set(pile, current);
  });

  return Array.from(balances, ([pile, values]) => ({
    pile,
    received: Number(values.received.toFixed(3)),
    shipped: Number(values.shipped.toFixed(3)),
    balance: Number((values.received - values.shipped).toFixed(3))
  }))
    .filter((item) => item.received !== 0 || item.shipped !== 0)
    .sort((a, b) => b.balance - a.balance);
};

const buildDailyVolumes = (
  startDate: Date,
  endDate: Date,
  noteDates: { dataHora: Date | null; createdAt: Date }[],
  recordDates: { dataHora: Date }[]
): DailyVolumeItem[] => {
  const buckets = new Map<string, DailyVolumeItem>();
  buildDateKeys(startDate, endDate).forEach((key) => buckets.set(key, { date: key, emittedNotes: 0, receivedRecords: 0 }));

  noteDates.forEach((note) => {
    const key = dateKey(note.dataHora ?? note.createdAt);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.emittedNotes += 1;
    }
  });

  recordDates.forEach((record) => {
    const key = dateKey(record.dataHora);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.receivedRecords += 1;
    }
  });

  return Array.from(buckets.values());
};

const buildDailyReceivedWeights = (
  startDate: Date,
  endDate: Date,
  receipts: { dataHora: Date | null; createdAt: Date; recebimentoPeso: string | null }[]
): DailyReceivedWeightItem[] => {
  const buckets = new Map<string, DailyReceivedWeightItem>();
  buildDateKeys(startDate, endDate).forEach((key) => buckets.set(key, { date: key, totalWeight: 0 }));

  receipts.forEach((receipt) => {
    const bucket = buckets.get(dateKey(receipt.dataHora ?? receipt.createdAt));
    if (bucket) bucket.totalWeight += parseWeight(receipt.recebimentoPeso);
  });

  return Array.from(buckets.values()).map((item) => ({
    ...item,
    totalWeight: Number(item.totalWeight.toFixed(3))
  }));
};

const buildRawConditions = (filters: ReportOverviewQueryInput) => {
  return {
    noteConditions: Prisma.sql`
      (
        (n.data_hora >= ${filters.startDate} AND n.data_hora <= ${filters.endDate})
        OR (n.data_hora IS NULL AND n.created_at >= ${filters.startDate} AND n.created_at <= ${filters.endDate})
      )
    `,
    recordConditions: Prisma.sql`
      r.data_hora >= ${filters.startDate}
      AND r.data_hora <= ${filters.endDate}
    `
  };
};

export const getReportOverviewService = async (filters: ReportOverviewQueryInput) => {
  const terminal = filters.terminal?.trim().toUpperCase();
  const recordWhere = buildRecordWhere(filters);
  const noteWhere = buildNoteWhere(filters);
  const shipmentWhere: Prisma.ShipmentWhereInput = {
    ...(filters.terminal ? { terminal: filters.terminal } : {}),
    shippedAt: {
      gte: filters.startDate,
      lte: filters.endDate
    }
  };
  const useNoteReceipts = filters.terminal?.trim().toUpperCase() === "TCS";
  const pendingNoteWhere: Prisma.NoteWhereInput = {
    ...noteWhere,
    status: { equals: "PENDENTE", mode: "insensitive" }
  };
  const pendingOver24hWhere: Prisma.NoteWhereInput = {
    ...pendingNoteWhere,
    createdAt: {
      lt: new Date(Date.now() - 24 * 60 * 60 * 1000)
    }
  };

  const [
    emittedNotes,
    weighedRecords,
    pendingNotes,
    pendingOver24h,
    recordsWithoutPesagemId,
    noteStatusRows,
    recordStatusRows,
    noteTerminalRows,
    recordTerminalRows,
    oldestPendingNotes,
    noteDates,
    recordDates,
    pileRecords,
    shipments,
    tbjcReceipts,
    activeSinterFeeds,
    activeBlends
  ] = await prisma.$transaction([
    prisma.note.count({ where: noteWhere }),
    prisma.record.count({ where: recordWhere }),
    prisma.note.count({ where: pendingNoteWhere }),
    prisma.note.count({ where: pendingOver24hWhere }),
    prisma.record.count({
      where: {
        ...recordWhere,
        notaPesagemId: ""
      }
    }),
    prisma.note.groupBy({ by: ["status"], where: noteWhere, _count: { _all: true } }),
    prisma.record.groupBy({ by: ["status"], where: recordWhere, _count: { _all: true } }),
    prisma.note.groupBy({ by: ["terminal"], where: noteWhere, _count: { _all: true } }),
    prisma.record.groupBy({ by: ["terminal"], where: recordWhere, _count: { _all: true } }),
    prisma.note.findMany({
      where: pendingNoteWhere,
      orderBy: { createdAt: "asc" },
      take: 10,
      select: {
        codigo: true,
        terminal: true,
        placa: true,
        motoristaNome: true,
        status: true,
        createdAt: true
      }
    }),
    prisma.note.findMany({ where: noteWhere, select: { dataHora: true, createdAt: true } }),
    prisma.record.findMany({ where: recordWhere, select: { dataHora: true } }),
    useNoteReceipts
      ? prisma.note.findMany({
          where: { ...noteWhere, recebimentoPeso: { not: null } },
          select: { dataHora: true, createdAt: true, recebimentoPatioDescarga: true, recebimentoPeso: true }
        })
      : prisma.record.findMany({
          where: { ...recordWhere, recebimentoPeso: { not: null } },
          select: { dataHora: true, createdAt: true, recebimentoPatioDescarga: true, recebimentoPeso: true }
        }),
    prisma.shipment.findMany({ where: shipmentWhere, select: { pile: true, volume: true, blend: { select: { code: true } } } }),
    prisma.record.findMany({
      where: recordWhere,
      select: {
        dataHora: true,
        recebimentoPeso: true,
        issuerSinterFeedMapping: { select: { sinterFeed: { select: { code: true } }, blend: { select: { code: true } } } }
      }
    }),
    prisma.sinterFeed.findMany({ where: { isActive: true }, select: { code: true }, orderBy: { code: "asc" } }),
    prisma.blend.findMany({ where: { isActive: true }, select: { code: true }, orderBy: { code: "asc" } })
  ]);

  const { noteConditions, recordConditions } = buildRawConditions(filters);

  const [matchedRows, averageRows, duplicateNotaRows, duplicatePesagemRows] = await Promise.all([
    prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(DISTINCT n.codigo)::int AS count
      FROM notes n
      INNER JOIN records r ON r.numero_nota = n.codigo
      WHERE ${noteConditions}
      AND ${recordConditions}
    `,
    prisma.$queryRaw<AverageRow[]>`
      SELECT AVG(ABS(EXTRACT(EPOCH FROM (matched.first_record_at - matched.created_at))) / 3600)::float AS "averageHours"
      FROM (
        SELECT n.codigo, n.created_at, MIN(r.created_at) AS first_record_at
        FROM notes n
        INNER JOIN records r ON r.numero_nota = n.codigo
        WHERE ${noteConditions}
        AND ${recordConditions}
        GROUP BY n.codigo, n.created_at
      ) matched
    `,
    prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(*)::int AS count
      FROM (
        SELECT r.numero_nota
        FROM records r
        WHERE ${recordConditions}
        GROUP BY r.numero_nota
        HAVING COUNT(*) > 1
      ) duplicated_records
    `,
    prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(*)::int AS count
      FROM (
        SELECT r.nota_pesagem_id
        FROM records r
        WHERE ${recordConditions}
        AND r.nota_pesagem_id <> ''
        GROUP BY r.nota_pesagem_id
        HAVING COUNT(*) > 1
      ) duplicated_pesagens
    `
  ]);

  const matchedNotes = toNumber(matchedRows[0]?.count);
  const duplicateNotaGroups = toNumber(duplicateNotaRows[0]?.count);
  const duplicatePesagemGroups = toNumber(duplicatePesagemRows[0]?.count);
  const averageReconciliationHours = averageRows[0]?.averageHours
    ? Number(toNumber(averageRows[0].averageHours).toFixed(1))
    : null;

  const now = Date.now();
  const pendingOldest: PendingNoteItem[] = oldestPendingNotes.map((note) => ({
    ...note,
    ageHours: Number(((now - note.createdAt.getTime()) / (60 * 60 * 1000)).toFixed(1))
  }));

  const receivedMaterialWeight = pileRecords.reduce((total, item) => total + parseWeight(item.recebimentoPeso), 0);
  const shippedMaterialWeight = shipments.reduce((total, item) => total + item.volume.toNumber(), 0);
  const pileBalances = useNoteReceipts ? buildPileBalances(pileRecords, shipments) : [];
  const dailyReceivedWeights = buildDailyReceivedWeights(filters.startDate, filters.endDate, pileRecords);
  const mappedCodes = tbjcReceipts.flatMap((receipt) => receipt.issuerSinterFeedMapping ? [receipt.issuerSinterFeedMapping.sinterFeed.code] : []);
  const sinterFeedCodes = Array.from(new Set([...activeSinterFeeds.map((item) => item.code), ...mappedCodes])).sort();
  const dailySinterFeedWeights = terminal === "TBJC"
    ? buildDailySinterFeedWeights(filters.startDate, filters.endDate, sinterFeedCodes, tbjcReceipts)
    : [];
  const blendBalances = terminal === "TBJC" ? buildBlendBalances(tbjcReceipts, shipments, activeBlends.map((item) => item.code)) : [];
  const unclassifiedReceivedCount = terminal === "TBJC"
    ? tbjcReceipts.filter((receipt) => parseValidWeight(receipt.recebimentoPeso) === null || !receipt.issuerSinterFeedMapping).length
    : 0;
  const classifiedReceivedWeight = dailySinterFeedWeights.reduce((total, item) => total + item.totalWeight, 0);
  const classifiedShippedWeight = blendBalances.reduce((total, item) => total + item.shipped, 0);
  const reportReceivedWeight = terminal === "TBJC" ? Number(classifiedReceivedWeight.toFixed(3)) : Number(receivedMaterialWeight.toFixed(3));
  const reportShippedWeight = terminal === "TBJC" ? Number(classifiedShippedWeight.toFixed(3)) : Number(shippedMaterialWeight.toFixed(3));
  const reportDailyReceivedWeights = terminal === "TBJC"
    ? dailySinterFeedWeights.map(({ date, totalWeight }) => ({ date, totalWeight }))
    : dailyReceivedWeights;

  return {
    filters: {
      startDate: filters.startDate.toISOString(),
      endDate: filters.endDate.toISOString(),
      terminal: filters.terminal ?? null
    },
    summary: {
      emittedNotes,
      receivedRecords: weighedRecords,
      receivedMaterialWeight: reportReceivedWeight,
      shippedMaterialWeight: reportShippedWeight,
      availableMaterialWeight: Number((reportReceivedWeight - reportShippedWeight).toFixed(3)),
      matchedNotes,
      pendingNotes,
      pendingOver24h,
      recordsWithoutPesagemId,
      duplicateNotaGroups,
      duplicatePesagemGroups,
      reconciliationRate: percentage(matchedNotes, emittedNotes),
      weighingCoverageRate: percentage(weighedRecords, emittedNotes),
      averageReconciliationHours
    },
    breakdowns: {
      notesByStatus: normalizeBreakdown(noteStatusRows, (row) => row.status),
      recordsByStatus: normalizeBreakdown(recordStatusRows, (row) => row.status),
      notesByTerminal: normalizeBreakdown(noteTerminalRows, (row) => row.terminal).slice(0, 8),
      recordsByTerminal: normalizeBreakdown(recordTerminalRows, (row) => row.terminal).slice(0, 8)
    },
    dailyVolumes: buildDailyVolumes(filters.startDate, filters.endDate, noteDates, recordDates),
    dailyReceivedWeights: reportDailyReceivedWeights,
    pileBalances,
    dailySinterFeedWeights,
    sinterFeedCodes,
    blendBalances,
    unclassifiedReceivedCount,
    pendingOldest
  };
};
