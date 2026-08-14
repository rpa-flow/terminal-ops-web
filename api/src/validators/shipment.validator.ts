import { z } from "zod";

export const shipmentTerminalSchema = z.enum(["TBJC", "TCS"]);

const optionalText = (maxLength: number) => z.string().trim().min(1).max(maxLength).nullish();

export const createShipmentSchema = z.object({
  terminal: shipmentTerminalSchema,
  shippedAt: z.coerce.date(),
  volume: z.coerce.number().positive().max(999999999999),
  destination: optionalText(120),
  document: optionalText(64),
  notes: optionalText(255)
}).strict();

export const listShipmentsQuerySchema = z.object({
  terminal: shipmentTerminalSchema,
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional()
}).strict();

export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;
export type ListShipmentsInput = z.infer<typeof listShipmentsQuerySchema>;
