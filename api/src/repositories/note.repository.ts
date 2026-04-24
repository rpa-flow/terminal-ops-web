import type { Note } from "@prisma/client";

import { prisma } from "../lib/prisma";
import type { ListPendingNotesQueryInput } from "../validators/note.validator";

type ListPendingNotesResult = {
  total: number;
  items: Note[];
};

export const createNote = async (codigo: string, terminal: string): Promise<Note> => {
  return prisma.note.create({
    data: {
      codigo,
      terminal,
      status: "PENDENTE"
    }
  });
};

export const listPendingNotes = async (
  filters: ListPendingNotesQueryInput
): Promise<ListPendingNotesResult> => {
  const skip = (filters.page - 1) * filters.perPage;

  const where = {
    status: {
      equals: "PENDENTE",
      mode: "insensitive" as const
    }
  };

  const [total, items] = await prisma.$transaction([
    prisma.note.count({ where }),
    prisma.note.findMany({
      where,
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
