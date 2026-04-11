"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const run = async () => {
    const email = "admin@admin.com";
    const plainPassword = "123456";
    const passwordHash = await bcryptjs_1.default.hash(plainPassword, 12);
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
//# sourceMappingURL=seed.js.map