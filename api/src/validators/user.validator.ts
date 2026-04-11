import { z } from "zod";

export const createUserSchema = z
  .object({
    email: z.string().trim().email().max(254),
    password: z.string().min(8).max(72)
  })
  .strict()
  .transform((input) => ({
    email: input.email.toLowerCase(),
    password: input.password
  }));

export type CreateUserInput = z.infer<typeof createUserSchema>;
