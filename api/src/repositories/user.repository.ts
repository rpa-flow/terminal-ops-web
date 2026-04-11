import type { User } from "@prisma/client";

import { prisma } from "../lib/prisma";

export const findUserByEmail = async (email: string): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { email }
  });
};