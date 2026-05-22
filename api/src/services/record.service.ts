import xss from "xss";

import { createRecord, findLatestRecordByNumeroNota, listRecords, updateRecordStatusById } from "../repositories/record.repository";
import type { CreateRecordInput, ListRecordsFilters } from "../validators/record.validator";

const sanitizeString = (value: string): string => xss(value, { whiteList: {} });

const sanitizeRecord = (record: {
  id: string;
  dataHora: Date;
  numeroNota: string;
  notaOriginal: string;
  status: string;
  notaPesagemId: string;
  motoristaNome: string;
  motoristaCelular: string;
  placa: string;
  terminal: string;
  createdAt: Date;
}) => ({
  ...record,
  numeroNota: sanitizeString(record.numeroNota),
  notaOriginal: sanitizeString(record.notaOriginal),
  status: sanitizeString(record.status),
  notaPesagemId: sanitizeString(record.notaPesagemId),
  motoristaNome: sanitizeString(record.motoristaNome),
  motoristaCelular: sanitizeString(record.motoristaCelular),
  placa: sanitizeString(record.placa),
  terminal: sanitizeString(record.terminal)
});

export const createRecordService = async (input: CreateRecordInput) => {
  const saved = await createRecord(input);
  return sanitizeRecord(saved);
};

export const listRecordsService = async (filters: ListRecordsFilters) => {
  const result = await listRecords(filters);

  return {
    ...result,
    items: result.items.map(sanitizeRecord)
  };
};

export const updateRecordStatusByNumeroNotaService = async (
  numeroNota: string,
  status: string,
  numeroOriginal?: string,
  idPesagem?: string
) => {
  const record = await findLatestRecordByNumeroNota(numeroNota);
  if (!record) {
    return null;
  }

  const updated = await updateRecordStatusById(record.id, status, numeroOriginal, idPesagem);
  return sanitizeRecord(updated);
};
