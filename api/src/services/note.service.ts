import xss from "xss";

import {
  createNote,
  findNoteByCodigo,
  listPendingNotes,
  updateNoteStatusByCodigo
} from "../repositories/note.repository";
import type { CreateNoteInput, ListPendingNotesQueryInput } from "../validators/note.validator";

const sanitizeString = (value: string): string => xss(value, { whiteList: {} });

const sanitizeOptionalString = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }

  return sanitizeString(value);
};

const sanitizeNote = (note: {
  id: string;
  codigo: string;
  status: string;
  terminal: string;
  placa: string | null;
  motoristaNome: string | null;
  motoristaTelefone: string | null;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  ...note,
  codigo: sanitizeString(note.codigo),
  status: sanitizeString(note.status),
  terminal: sanitizeString(note.terminal),
  placa: sanitizeOptionalString(note.placa),
  motoristaNome: sanitizeOptionalString(note.motoristaNome),
  motoristaTelefone: sanitizeOptionalString(note.motoristaTelefone)
});

export const createNoteService = async (input: CreateNoteInput) => {
  const saved = await createNote(input);
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
