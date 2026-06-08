import type { Prisma, Record } from "@prisma/client";

import { prisma } from "../lib/prisma";
import type { CreateRecordInput, ListRecordsFilters } from "../validators/record.validator";

type ListRecordsResult = {
  total: number;
  items: Record[];
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
    where.terminal = { contains: filters.terminal, mode: "insensitive" };
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

export const listRecords = async (filters: ListRecordsFilters): Promise<ListRecordsResult> => {
  const where = buildWhere(filters);
  const skip = (filters.page - 1) * filters.perPage;

  const [total, items] = await prisma.$transaction([
    prisma.record.count({ where }),
    prisma.record.findMany({
      where,
      orderBy: { dataHora: "desc" },
      skip,
      take: filters.perPage
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
      ...(idPesagem ? { notaPesagemId: idPesagem } : {})
    }
  });
};
