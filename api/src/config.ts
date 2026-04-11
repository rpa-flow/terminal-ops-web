import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("1h"),
  INGEST_API_KEY: z.string().min(16, "INGEST_API_KEY must be at least 16 characters"),
  PROVISION_SECRET: z.string().min(32, "PROVISION_SECRET must be at least 32 characters"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  TRUST_PROXY: z.coerce.number().int().min(0).max(1).default(0)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
}

export const env = parsed.data;