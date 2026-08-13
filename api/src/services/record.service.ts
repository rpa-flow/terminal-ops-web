import xss from "xss";

import { createRecord, createRecords, findLatestRecordByNumeroNota, listRecords, updateRecordStatusById } from "../repositories/record.repository";
import type { CreateRecordInput, ListRecordsFilters } from "../validators/record.validator";
import { resolvePurchaseOrder } from "./purchase-order-rule.service";

const sanitizeString = (value: string): string => xss(value, { whiteList: {} });
const sanitizeOptionalString = (value: string | null): string | null => (value === null ? null : sanitizeString(value));

const sanitizeRecord = (record: {
  id: string;
  dataHora: Date;
  numeroNota: string;
  notaChave: string | null;
  notaOriginal: string;
  status: string;
  notaPesagemId: string;
  emitenteCnpj: string | null;
  emitenteFornecedor: string | null;
  motoristaNome: string | null;
  motoristaCelular: string | null;
  placa: string;
  placaRecebimento: string | null;
  recebimentoColaborador: string | null;
  recebimentoPeso: string | null;
  recebimentoPatioDescarga: string | null;
  recebimentoData: string | null;
  recebimentoPlaca: string | null;
  terminal: string;
  createdAt: Date;
}) => ({
  ...record,
  numeroNota: sanitizeString(record.numeroNota),
  notaChave: sanitizeOptionalString(record.notaChave),
  notaOriginal: sanitizeString(record.notaOriginal),
  status: sanitizeString(record.status),
  notaPesagemId: sanitizeString(record.notaPesagemId),
  emitenteCnpj: sanitizeOptionalString(record.emitenteCnpj),
  emitenteFornecedor: sanitizeOptionalString(record.emitenteFornecedor),
  motoristaNome: sanitizeOptionalString(record.motoristaNome),
  motoristaCelular: sanitizeOptionalString(record.motoristaCelular),
  placa: sanitizeString(record.placa),
  placaRecebimento: sanitizeOptionalString(record.placaRecebimento),
  recebimentoColaborador: sanitizeOptionalString(record.recebimentoColaborador),
  recebimentoPeso: sanitizeOptionalString(record.recebimentoPeso),
  recebimentoPatioDescarga: sanitizeOptionalString(record.recebimentoPatioDescarga),
  recebimentoData: sanitizeOptionalString(record.recebimentoData),
  recebimentoPlaca: sanitizeOptionalString(record.recebimentoPlaca),
  terminal: sanitizeString(record.terminal)
});

export const createRecordService = async (input: CreateRecordInput & { materialId?: string; supplierId?: string }) => {
  if (input.materialId && input.supplierId) {
    await resolvePurchaseOrder(input.materialId, input.supplierId);
  }
  const saved = await createRecord(input);
  return sanitizeRecord(saved);
};

export const importCsvRecordsService = (inputs: CreateRecordInput[]) => createRecords(inputs);

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
