CREATE TABLE "notes" (
  "id" UUID NOT NULL,
  "codigo" VARCHAR(44) NOT NULL,
  "status" VARCHAR(64) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "notes_codigo_key" ON "notes"("codigo");
CREATE INDEX "notes_status_idx" ON "notes"("status");
