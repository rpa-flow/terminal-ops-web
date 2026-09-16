import { z } from "zod";

export const shipmentTerminalSchema = z.enum(["TBJC", "TCS"]);

const optionalText = (maxLength: number) => z.string().trim().min(1).max(maxLength).nullish();

export const createShipmentSchema = z.object({
  terminal: shipmentTerminalSchema,
  shippedAt: z.coerce.date(),
  volume: z.coerce.number().positive().max(999999999999),
  blendId: z.uuid().nullish(),
  pile: optionalText(120),
  destination: optionalText(120),
  document: optionalText(64),
  notes: optionalText(255)
}).strict().superRefine((input, ctx) => {
  if (input.terminal === "TBJC" && !input.blendId) {
    ctx.addIssue({ code: "custom", path: ["blendId"], message: "Blend é obrigatório para embarques TBJC" });
  }
  if (input.terminal === "TCS" && !input.pile) {
    ctx.addIssue({ code: "custom", path: ["pile"], message: "Pilha é obrigatória para embarques TCS" });
  }
});

export const listShipmentsQuerySchema = z.object({
  terminal: shipmentTerminalSchema,
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional()
}).strict();

export const deleteShipmentParamsSchema = z.object({
  id: z.uuid()
}).strict();

export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;
export type ListShipmentsInput = z.infer<typeof listShipmentsQuerySchema>;
