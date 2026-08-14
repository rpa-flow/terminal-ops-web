import type { ShipmentItem, ShipmentsResponse } from "../types/api";
import { http } from "./http";

type CreateShipmentPayload = Pick<ShipmentItem, "terminal" | "shippedAt" | "volume"> &
  Partial<Pick<ShipmentItem, "destination" | "document" | "notes">>;

export const listShipmentsRequest = (token: string, terminal: "TBJC" | "TCS") =>
  http<ShipmentsResponse>("/shipments", { token, query: { terminal } });

export const createShipmentRequest = (token: string, payload: CreateShipmentPayload) =>
  http<ShipmentItem>("/shipments", { token, method: "POST", body: payload });
