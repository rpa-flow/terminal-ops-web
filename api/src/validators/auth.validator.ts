import { z } from "zod";

export const loginSchema = z
  .object({
    email: z.string().email().max(254).transform((value) => value.trim().toLowerCase()),
    password: z.string().min(6).max(100)
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;