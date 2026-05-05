import type { PendingNotesResponse } from "../types/api";
import { http } from "./http";

export const listPendingNotesRequest = (
  token: string,
  page: number,
  perPage: number
): Promise<PendingNotesResponse> => {
  return http<PendingNotesResponse>("/notes/pending", {
    token,
    query: { page, perPage }
  });
};
