import type { CsvUploadResponse, RecordFilters, RecordsResponse } from "../types/api";
import { http } from "./http";

export const listRecordsRequest = (token: string, filters: RecordFilters): Promise<RecordsResponse> => {
  return http<RecordsResponse>("/records", {
    token,
    query: {
      page: filters.page,
      perPage: filters.perPage,
      startDate: filters.startDate,
      endDate: filters.endDate,
      status: filters.status,
      motorista: filters.motorista,
      placa: filters.placa,
      terminal: filters.terminal,
    },
  });
};

export const uploadCsvRequest = (token: string, file: File): Promise<CsvUploadResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  return http<CsvUploadResponse>("/records/csv", {
    method: "POST",
    formData,
    token,
  });
};

