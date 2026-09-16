import type { Prisma, Record } from "@prisma/client";

import { prisma } from "../lib/prisma";
import type { CreateRecordInput, IngestRecordInput, ListRecordsFilters } from "../validators/record.validator";

type ListedRecord = Prisma.RecordGetPayload<{
  include: {
    issuerSinterFeedMapping: {
      select: { sinterFeed: { select: { code: true } }; blend: { select: { code: true } } };
    };
  };
}>;

type ListRecordsResult = {
  total: number;
  items: ListedRecord[];
};

const buildWhere = (filters: ListRecordsFilters): Prisma.RecordWhereInput => {
  const where: Prisma.RecordWhereInput = {};

  if (filters.status) {
    where.status = { equals: filters.status, mode: "insensitive" };
  }

  if (filters.motorista) {
    where.motoristaNome = { contains: filters.motorista, mode: "insensitive" };
  }

  if (filters.placa) {
    where.placa = { contains: filters.placa, mode: "insensitive" };
  }

  if (filters.terminal) {
    const normalized = filters.terminal.trim().toUpperCase();
    const aliases = normalized === "TBJC" ? ["TBJC", "TJBC"] : [normalized];
    where.OR = aliases.map((terminal) => ({
      terminal: { contains: terminal, mode: "insensitive" }
    }));
  }

  if (filters.startDate || filters.endDate) {
    const dateFilter: Prisma.DateTimeFilter<"Record"> = {};

    if (filters.startDate) {
      dateFilter.gte = filters.startDate;
    }

    if (filters.endDate) {
      dateFilter.lte = filters.endDate;
    }

    where.dataHora = dateFilter;
  }

  return where;
};

export const createRecord = async (input: CreateRecordInput): Promise<Record> => {
  return prisma.record.create({ data: input });
};

export const createIngestedRecord = async (input: IngestRecordInput): Promise<Record> => {
  return prisma.$transaction(async (tx) => {
    const sinterFeed = input.sinterFeedValue
      ? await tx.sinterFeed.upsert({
          where: { code: input.sinterFeedValue },
          create: { code: input.sinterFeedValue },
          update: {}
        })
      : null;

    if (!input.notaChave) {
      return tx.record.create({ data: input });
    }

    const emitenteCnpj = input.notaChave.slice(6, 20);
    const issuer = await tx.issuer.upsert({
      where: { cnpj: emitenteCnpj },
      create: {
        cnpj: emitenteCnpj,
        descricao: input.emitenteFornecedor
      },
      update: {}
    });

    const now = new Date();
    const mapping = sinterFeed
      ? await tx.issuerSinterFeedMapping.findFirst({
          where: {
            issuerId: issuer.id,
            isActive: true,
            startsAt: { lte: now },
            OR: [{ endsAt: null }, { endsAt: { gte: now } }],
            sinterFeedId: sinterFeed.id,
            sinterFeed: { isActive: true },
            blend: { isActive: true }
          },
          orderBy: { startsAt: "desc" }
        })
      : null;

    return tx.record.create({
      data: {
        ...input,
        emitenteCnpj,
        issuerId: issuer.id,
        issuerSinterFeedMappingId: mapping?.id ?? null
      }
    });
  });
};

export const createRecords = async (inputs: CreateRecordInput[]): Promise<number> => {
  if (inputs.length === 0) return 0;

  const result = await prisma.record.createMany({ data: inputs });
  return result.count;
};

export const listRecords = async (filters: ListRecordsFilters): Promise<ListRecordsResult> => {
  const where = buildWhere(filters);
  const skip = (filters.page - 1) * filters.perPage;

  const [total, items] = await prisma.$transaction([
    prisma.record.count({ where }),
    prisma.record.findMany({
      where,
      orderBy: [{ dataHora: "desc" }, { createdAt: "desc" }],
      skip,
      take: filters.perPage,
      include: { issuerSinterFeedMapping: { select: { sinterFeed: { select: { code: true } }, blend: { select: { code: true } } } } }
    })
  ]);

  return { total, items };
};

export const findLatestRecordByNumeroNota = async (numeroNota: string): Promise<Record | null> => {
  return prisma.record.findFirst({
    where: { numeroNota },
    orderBy: [{ dataHora: "desc" }, { createdAt: "desc" }]
  });
};

export const updateRecordStatusById = async (
  id: string,
  status: string,
  numeroOriginal?: string,
  idPesagem?: string
): Promise<Record> => {
  return prisma.record.update({
    where: { id },
    data: {
      status,
      ...(numeroOriginal ? { notaOriginal: numeroOriginal } : {}),
      ...(idPesagem !== undefined ? { notaPesagemId: idPesagem } : {})
    }
  });
};
