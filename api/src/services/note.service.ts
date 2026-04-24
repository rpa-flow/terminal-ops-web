import xss from "xss";

import {
  createNote,
  findNoteByCodigo,
  listPendingNotes,
  updateNoteStatusByCodigo
} from "../repositories/note.repository";
import type { ListPendingNotesQueryInput } from "../validators/note.validator";

const sanitizeString = (value: string): string => xss(value, { whiteList: {} });

const sanitizeNote = (note: {
  id: string;
  codigo: string;
  status: string;
  terminal: string;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  ...note,
  codigo: sanitizeString(note.codigo),
  status: sanitizeString(note.status),
  terminal: sanitizeString(note.terminal)
});

export const createNoteService = async (codigo: string, terminal: string) => {
  const saved = await createNote(codigo, terminal);
  return sanitizeNote(saved);
};

export const listPendingNotesService = async (filters: ListPendingNotesQueryInput) => {
  const result = await listPendingNotes(filters);

  return {
    ...result,
    items: result.items.map(sanitizeNote)
  };
};

export const updateNoteStatusService = async (codigo: string, status: string) => {
  const existing = await findNoteByCodigo(codigo);
  if (!existing) {
    return null;
  }

  const updated = await updateNoteStatusByCodigo(codigo, status);
  return sanitizeNote(updated);
};
