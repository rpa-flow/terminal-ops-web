import type { LoginPayload, LoginResponse } from "../types/api";
import { http } from "./http";

export const loginRequest = (payload: LoginPayload): Promise<LoginResponse> => {
  return http<LoginResponse>("/auth/login", {
    method: "POST",
    body: payload,
  });
};

export const meRequest = (token: string): Promise<{ user: { userId: string; email: string } }> => {
  return http<{ user: { userId: string; email: string } }>("/auth/me", {
    token,
  });
};
