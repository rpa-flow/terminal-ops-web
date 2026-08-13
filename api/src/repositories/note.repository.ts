import type { Note, Prisma } from "@prisma/client";

import { prisma } from "../lib/prisma";
import type { ListNotesQueryInput } from "../validators/note.validator";

type ListNotesResult = {
  total: number;
  items: Note[];
};

type CreateNoteRepositoryInput = {
  codigo: string;
  terminal: string;
  placa?: string | undefined;
  motoristaNome?: string | undefined;
  motoristaTelefone?: string | undefined;
};

export type UpsertIngestedNoteRepositoryInput = {
  codigo: string;
  dataHora: Date;
  numero: string;
  original: string;
  terminal: string;
  status: string;
  emitenteCnpj: string | null;
  emitenteFornecedor: string | null;
  placa: string;
  motoristaNome: string | null;
  motoristaTelefone: string | null;
  recebimentoColaborador: string | null;
  recebimentoPeso: string | null;
  recebimentoPatioDescarga: string | null;
  recebimentoData: string | null;
};

const ingestedNoteData = (input: UpsertIngestedNoteRepositoryInput) => ({
  dataHora: input.dataHora,
  numero: input.numero,
  original: input.original,
  terminal: input.terminal,
  status: input.status,
  emitenteCnpj: input.emitenteCnpj,
  emitenteFornecedor: input.emitenteFornecedor,
  placa: input.placa,
  motoristaNome: input.motoristaNome,
  motoristaTelefone: input.motoristaTelefone,
  recebimentoColaborador: input.recebimentoColaborador,
  recebimentoPeso: input.recebimentoPeso,
  recebimentoPatioDescarga: input.recebimentoPatioDescarga,
  recebimentoData: input.recebimentoData
});

export const createNote = async (input: CreateNoteRepositoryInput): Promise<Note> => {
  const data: Prisma.NoteCreateInput = {
    codigo: input.codigo,
    terminal: input.terminal,
    status: "PENDENTE",
    ...(input.placa ? { placa: input.placa } : {}),
    ...(input.motoristaNome ? { motoristaNome: input.motoristaNome } : {}),
    ...(input.motoristaTelefone ? { motoristaTelefone: input.motoristaTelefone } : {})
  };

  return prisma.note.create({ data });
};

export const upsertIngestedNote = async (input: UpsertIngestedNoteRepositoryInput): Promise<Note> => {
  const data = ingestedNoteData(input);

  return prisma.note.upsert({
    where: { codigo: input.codigo },
    create: { codigo: input.codigo, ...data },
    update: data
  });
};

export const upsertIngestedNotes = async (inputs: UpsertIngestedNoteRepositoryInput[]): Promise<number> => {
  if (inputs.length === 0) return 0;

  await prisma.$transaction(
    inputs.map((input) => {
      const data = ingestedNoteData(input);
      return prisma.note.upsert({
        where: { codigo: input.codigo },
        create: { codigo: input.codigo, ...data },
        update: data
      });
    })
  );
  return inputs.length;
};

export const listNotes = async (filters: ListNotesQueryInput): Promise<ListNotesResult> => {
  const skip = (filters.page - 1) * filters.perPage;

  const [total, items] = await prisma.$transaction([
    prisma.note.count(),
    prisma.note.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: filters.perPage
    })
  ]);

  return { total, items };
};

export const findNoteByCodigo = async (codigo: string): Promise<Note | null> => {
  return prisma.note.findUnique({ where: { codigo } });
};

export const updateNoteStatusByCodigo = async (codigo: string, status: string): Promise<Note> => {
  return prisma.note.update({
    where: { codigo },
    data: { status }
  });
};
