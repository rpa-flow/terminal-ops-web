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
  weighedRecords: number;
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
  const where: Prisma.RecordWhereInput = {
    dataHora: {
      gte: filters.startDate,
      lte: filters.endDate
    }
  };

  if (filters.terminal) {
    where.terminal = { contains: filters.terminal, mode: "insensitive" };
  }

  return where;
};

const buildNoteWhere = (filters: ReportOverviewQueryInput): Prisma.NoteWhereInput => {
  const where: Prisma.NoteWhereInput = {
    createdAt: {
      gte: filters.startDate,
      lte: filters.endDate
    }
  };

  if (filters.terminal) {
    where.terminal = { contains: filters.terminal, mode: "insensitive" };
  }

  return where;
};

const normalizeBreakdown = <T extends { _count: { _all: number } }>(
  rows: T[],
  labelSelector: (row: T) => string | null
): BreakdownItem[] =>
  rows
    .map((row) => ({ label: labelSelector(row) || "Nao informado", total: row._count._all }))
    .sort((a, b) => b.total - a.total);

const dateKey = (value: Date): string => value.toISOString().slice(0, 10);

const buildDailyVolumes = (
  startDate: Date,
  endDate: Date,
  noteDates: { createdAt: Date }[],
  recordDates: { dataHora: Date }[]
): DailyVolumeItem[] => {
  const buckets = new Map<string, DailyVolumeItem>();
  const cursor = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));
  const last = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()));

  while (cursor <= last && buckets.size < 366) {
    const key = dateKey(cursor);
    buckets.set(key, { date: key, emittedNotes: 0, weighedRecords: 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  noteDates.forEach((note) => {
    const key = dateKey(note.createdAt);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.emittedNotes += 1;
    }
  });

  recordDates.forEach((record) => {
    const key = dateKey(record.dataHora);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.weighedRecords += 1;
    }
  });

  return Array.from(buckets.values());
};

const buildRawConditions = (filters: ReportOverviewQueryInput) => {
  const terminalPattern = filters.terminal ? `%${filters.terminal}%` : undefined;

  return {
    noteConditions: Prisma.sql`
      n.created_at >= ${filters.startDate}
      AND n.created_at <= ${filters.endDate}
      ${terminalPattern ? Prisma.sql`AND n.terminal ILIKE ${terminalPattern}` : Prisma.empty}
    `,
    recordConditions: Prisma.sql`
      r.data_hora >= ${filters.startDate}
      AND r.data_hora <= ${filters.endDate}
      ${terminalPattern ? Prisma.sql`AND r.terminal ILIKE ${terminalPattern}` : Prisma.empty}
    `
  };
};

export const getReportOverviewService = async (filters: ReportOverviewQueryInput) => {
  const recordWhere = buildRecordWhere(filters);
  const noteWhere = buildNoteWhere(filters);
  const pendingNoteWhere: Prisma.NoteWhereInput = {
    ...noteWhere,
    status: { equals: "PENDENTE", mode: "insensitive" }
  };
  const pendingOver24hWhere: Prisma.NoteWhereInput = {
    ...pendingNoteWhere,
    createdAt: {
      ...(noteWhere.createdAt as Prisma.DateTimeFilter<"Note">),
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
    recordDates
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
    prisma.note.findMany({ where: noteWhere, select: { createdAt: true } }),
    prisma.record.findMany({ where: recordWhere, select: { dataHora: true } })
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
      SELECT AVG(ABS(EXTRACT(EPOCH FROM (matched.first_weigh_at - matched.created_at))) / 3600)::float AS "averageHours"
      FROM (
        SELECT n.codigo, n.created_at, MIN(r.data_hora) AS first_weigh_at
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

  return {
    filters: {
      startDate: filters.startDate.toISOString(),
      endDate: filters.endDate.toISOString(),
      terminal: filters.terminal ?? null
    },
    summary: {
      emittedNotes,
      weighedRecords,
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
    pendingOldest
  };
};
