import { z } from "zod";

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

const parseBoundaryDate = (value: string | undefined, isEndDate: boolean): Date | undefined => {
  if (!value) {
    return undefined;
  }

  const normalized = dateOnlyPattern.test(value)
    ? `${value}T${isEndDate ? "23:59:59.999" : "00:00:00.000"}`
    : value;

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export const reportOverviewQuerySchema = z
  .object({
    startDate: z.string().trim().min(1).optional(),
    endDate: z.string().trim().min(1).optional(),
    terminal: z.string().trim().min(1).max(120).optional()
  })
  .strict()
  .transform((input, ctx) => {
    const requestedEndDate = parseBoundaryDate(input.endDate, true);
    const endDate = requestedEndDate ?? new Date();
    const requestedStartDate = parseBoundaryDate(input.startDate, false);
    const startDate =
      requestedStartDate ??
      new Date(endDate.getTime() - 29 * 24 * 60 * 60 * 1000);

    if (input.startDate && !requestedStartDate) {
      ctx.addIssue({ code: "custom", path: ["startDate"], message: "Data inicial invalida" });
    }

    if (input.endDate && !requestedEndDate) {
      ctx.addIssue({ code: "custom", path: ["endDate"], message: "Data final invalida" });
    }

    if (startDate > endDate) {
      ctx.addIssue({ code: "custom", path: ["startDate"], message: "Data inicial deve ser menor que a final" });
    }

    return {
      startDate,
      endDate,
      terminal: input.terminal
    };
  });

export type ReportOverviewQueryInput = z.infer<typeof reportOverviewQuerySchema>;
