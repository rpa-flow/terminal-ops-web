import xss from "xss";

import {
  createNote,
  findNoteByCodigo,
  listNotes,
  upsertIngestedNote,
  upsertIngestedNotes,
  updateNoteStatusByCodigo
} from "../repositories/note.repository";
import type { IngestNoteInput } from "../validators/record.validator";
import type { CreateNoteInput, ListNotesQueryInput } from "../validators/note.validator";

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
  dataHora: Date | null;
  numero: string | null;
  original: string | null;
  status: string;
  terminal: string;
  emitenteCnpj: string | null;
  emitenteFornecedor: string | null;
  placa: string | null;
  motoristaNome: string | null;
  motoristaTelefone: string | null;
  recebimentoColaborador: string | null;
  recebimentoPeso: string | null;
  recebimentoPatioDescarga: string | null;
  recebimentoData: string | null;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  ...note,
  codigo: sanitizeString(note.codigo),
  numero: sanitizeOptionalString(note.numero),
  original: sanitizeOptionalString(note.original),
  status: sanitizeString(note.status),
  terminal: sanitizeString(note.terminal),
  emitenteCnpj: sanitizeOptionalString(note.emitenteCnpj),
  emitenteFornecedor: sanitizeOptionalString(note.emitenteFornecedor),
  placa: sanitizeOptionalString(note.placa),
  motoristaNome: sanitizeOptionalString(note.motoristaNome),
  motoristaTelefone: sanitizeOptionalString(note.motoristaTelefone),
  recebimentoColaborador: sanitizeOptionalString(note.recebimentoColaborador),
  recebimentoPeso: sanitizeOptionalString(note.recebimentoPeso),
  recebimentoPatioDescarga: sanitizeOptionalString(note.recebimentoPatioDescarga),
  recebimentoData: sanitizeOptionalString(note.recebimentoData)
});

export const createNoteService = async (input: CreateNoteInput) => {
  const saved = await createNote(input);
  return sanitizeNote(saved);
};

export const importCsvNoteService = async (input: {
  dataHora: Date;
  numeroNota: string;
  notaOriginal: string;
  status: string;
  terminal: string;
  placa: string;
  motoristaNome: string | null;
  motoristaCelular: string | null;
  recebimentoPeso: string | null;
}) => {
  const saved = await upsertIngestedNote({
    codigo: input.numeroNota,
    dataHora: input.dataHora,
    numero: input.numeroNota,
    original: input.notaOriginal,
    terminal: input.terminal,
    status: input.status,
    emitenteCnpj: null,
    emitenteFornecedor: null,
    placa: input.placa,
    motoristaNome: input.motoristaNome,
    motoristaTelefone: input.motoristaCelular,
    recebimentoColaborador: null,
    recebimentoPeso: input.recebimentoPeso,
    recebimentoPatioDescarga: null,
    recebimentoData: null
  });

  return sanitizeNote(saved);
};

type CsvNoteInput = Parameters<typeof importCsvNoteService>[0];

const toIngestedNote = (input: CsvNoteInput) => ({
  codigo: input.numeroNota,
  dataHora: input.dataHora,
  numero: input.numeroNota,
  original: input.notaOriginal,
  terminal: input.terminal,
  status: input.status,
  emitenteCnpj: null,
  emitenteFornecedor: null,
  placa: input.placa,
  motoristaNome: input.motoristaNome,
  motoristaTelefone: input.motoristaCelular,
  recebimentoColaborador: null,
  recebimentoPeso: input.recebimentoPeso,
  recebimentoPatioDescarga: null,
  recebimentoData: null
});

export const importCsvNotesService = (inputs: CsvNoteInput[]) => upsertIngestedNotes(inputs.map(toIngestedNote));

export const upsertIngestedNoteService = async (input: IngestNoteInput) => {
  const saved = await upsertIngestedNote({
    codigo: input.notaChave,
    dataHora: input.dataHora,
    numero: input.numeroNota,
    original: input.notaOriginal,
    terminal: input.terminal,
    status: input.status,
    emitenteCnpj: input.emitenteCnpj,
    emitenteFornecedor: input.emitenteFornecedor,
    placa: input.placa,
    motoristaNome: input.motoristaNome,
    motoristaTelefone: input.motoristaCelular,
    recebimentoColaborador: input.recebimentoColaborador,
    recebimentoPeso: input.recebimentoPeso,
    recebimentoPatioDescarga: input.recebimentoPatioDescarga,
    recebimentoData: input.recebimentoData
  });

  return sanitizeNote(saved);
};

export const listNotesService = async (filters: ListNotesQueryInput) => {
  const result = await listNotes(filters);

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
