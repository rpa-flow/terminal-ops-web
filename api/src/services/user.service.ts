import bcrypt from "bcryptjs";

import { prisma } from "../lib/prisma";
import type { CreateUserInput } from "../validators/user.validator";

export const createUserService = async (
  input: CreateUserInput
): Promise<{ id: string; email: string; createdAt: Date }> => {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });

  if (existing) {
    const err: NodeJS.ErrnoException = new Error("Email already in use");
    err.code = "DUPLICATE";
    throw err;
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  return prisma.user.create({
    data: { email: input.email, passwordHash },
    select: { id: true, email: true, createdAt: true }
  });
};
