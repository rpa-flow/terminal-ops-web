-- Some environments received the shipments table before the complete schema was
-- deployed. Keep this migration additive so it is safe for both those databases
-- and databases created entirely from Prisma migrations.
CREATE TABLE IF NOT EXISTS "shipments" (
  "id" UUID NOT NULL,
  "terminal" VARCHAR(16) NOT NULL,
  "shipped_at" TIMESTAMP(3) NOT NULL,
  "volume" DECIMAL(18,3) NOT NULL,
  "destination" VARCHAR(120),
  "document" VARCHAR(64),
  "notes" VARCHAR(255),
  "created_by" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "terminal" VARCHAR(16);
ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "id" UUID;
ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "shipped_at" TIMESTAMP(3);
ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "volume" DECIMAL(18,3);
ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "destination" VARCHAR(120);
ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "document" VARCHAR(64);
ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "notes" VARCHAR(255);
ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "created_by" UUID;
ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "shipments_terminal_shipped_at_idx"
  ON "shipments"("terminal", "shipped_at");
