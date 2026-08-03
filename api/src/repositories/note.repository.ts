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
