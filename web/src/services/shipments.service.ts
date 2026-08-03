import type { ShipmentItem, ShipmentsResponse } from "../types/api";
import { http } from "./http";

export const listShipmentsRequest = (token: string, terminal: "TBJC" | "TCS") =>
  http<ShipmentsResponse>("/shipments", { token, query: { terminal } });

export const createShipmentRequest = (token: string, payload: Omit<ShipmentItem, "id" | "createdAt">) =>
  http<ShipmentItem>("/shipments", { token, method: "POST", body: payload });
