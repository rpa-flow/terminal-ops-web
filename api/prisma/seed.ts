import "dotenv/config";

import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const run = async (): Promise<void> => {
  const email = "admin@admin.com";
  const plainPassword = "123456";
  const passwordHash = await bcrypt.hash(plainPassword, 12);

  await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: {
      email,
      passwordHash
    }
  });
};

run()
  .catch((err) => {
    console.error("Seed failed", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
