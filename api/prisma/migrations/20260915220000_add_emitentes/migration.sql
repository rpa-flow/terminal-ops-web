CREATE TABLE "emitentes" (
  "id" UUID NOT NULL,
  "cnpj" VARCHAR(14) NOT NULL,
  "descricao" VARCHAR(255),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "emitentes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "emitentes_cnpj_key" ON "emitentes"("cnpj");

ALTER TABLE "records" ADD COLUMN "emitente_id" UUID;

CREATE INDEX "records_emitente_id_idx" ON "records"("emitente_id");

ALTER TABLE "records"
  ADD CONSTRAINT "records_emitente_id_fkey"
  FOREIGN KEY ("emitente_id") REFERENCES "emitentes"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
