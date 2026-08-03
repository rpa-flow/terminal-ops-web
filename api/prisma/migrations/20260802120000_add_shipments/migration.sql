CREATE TABLE "shipments" (
  "id" UUID NOT NULL,
  "terminal" VARCHAR(16) NOT NULL,
  "shipped_at" TIMESTAMP(3) NOT NULL,
  "volume" DECIMAL(18,3) NOT NULL,
  "destination" VARCHAR(120),
  "document" VARCHAR(64),
  "notes" VARCHAR(255),
  "created_by" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "shipments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "shipments_volume_positive" CHECK ("volume" > 0),
  CONSTRAINT "shipments_terminal_valid" CHECK ("terminal" IN ('TBJC', 'TCS'))
);

CREATE INDEX "shipments_terminal_shipped_at_idx" ON "shipments"("terminal", "shipped_at");
