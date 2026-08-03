import type { NotesResponse } from "../types/api";
import { http } from "./http";

export const listNotesRequest = (
  token: string,
  page: number,
  perPage: number
): Promise<NotesResponse> => {
  return http<NotesResponse>("/notes", {
    token,
    query: { page, perPage }
  });
};
