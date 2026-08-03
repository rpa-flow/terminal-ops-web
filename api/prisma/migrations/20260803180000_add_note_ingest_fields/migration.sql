ALTER TABLE "notes"
ADD COLUMN "data_hora" TIMESTAMP(3),
ADD COLUMN "numero" VARCHAR(64),
ADD COLUMN "original" VARCHAR(255),
ADD COLUMN "emitente_cnpj" VARCHAR(32),
ADD COLUMN "emitente_fornecedor" VARCHAR(120),
ADD COLUMN "recebimento_colaborador" VARCHAR(120),
ADD COLUMN "recebimento_peso" VARCHAR(32),
ADD COLUMN "recebimento_patio_descarga" VARCHAR(120),
ADD COLUMN "recebimento_data" VARCHAR(25);

CREATE INDEX "notes_data_hora_idx" ON "notes"("data_hora");
