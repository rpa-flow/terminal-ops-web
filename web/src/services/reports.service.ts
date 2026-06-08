import type { ReportFilters, ReportOverviewResponse } from "../types/api";
import { http } from "./http";

export const getReportOverviewRequest = (
  token: string,
  filters: ReportFilters
): Promise<ReportOverviewResponse> => {
  return http<ReportOverviewResponse>("/reports/overview", {
    token,
    query: filters
  });
};
