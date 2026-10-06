import type { Prisma, Record } from "@prisma/client";

import { prisma } from "../lib/prisma";
import type { CreateRecordInput, IngestRecordInput, ListRecordsFilters } from "../validators/record.validator";

type ListedRecord = Prisma.RecordGetPayload<{
  include: {
    sinterFeedBlendMapping: {
      select: { sinterFeed: { select: { code: true } }; blend: { select: { code: true } } };
    };
  };
}>;

type ListRecordsResult = {
  total: number;
  items: ListedRecord[];
};

type ReclassifiableSinterFeedBlendMapping = {
  id: string;
  startsAt: Date;
  endsAt: Date | null;
  sinterFeed: { code: string };
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

export const reclassifyUnclassifiedRecordsForMapping = async (
  tx: Prisma.TransactionClient,
  mapping: ReclassifiableSinterFeedBlendMapping
): Promise<number> => {
  const result = await tx.record.updateMany({
    where: {
      sinterFeedValue: mapping.sinterFeed.code,
      sinterFeedBlendMappingId: null,
      dataHora: {
        gte: mapping.startsAt,
        ...(mapping.endsAt ? { lt: mapping.endsAt } : {})
      }
    },
    data: { sinterFeedBlendMappingId: mapping.id }
  });

  return result.count;
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

    const now = new Date();
    const mapping = sinterFeed
      ? await tx.sinterFeedBlendMapping.findFirst({
          where: {
            isActive: true,
            startsAt: { lte: now },
            OR: [{ endsAt: null }, { endsAt: { gt: now } }],
            sinterFeedId: sinterFeed.id
          },
          orderBy: { startsAt: "desc" }
        })
      : null;

    if (!input.notaChave) {
      return tx.record.create({ data: { ...input, sinterFeedBlendMappingId: mapping?.id ?? null } });
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

    return tx.record.create({
      data: {
        ...input,
        emitenteCnpj,
        issuerId: issuer.id,
        sinterFeedBlendMappingId: mapping?.id ?? null
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
      include: { sinterFeedBlendMapping: { select: { sinterFeed: { select: { code: true } }, blend: { select: { code: true } } } } }
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
