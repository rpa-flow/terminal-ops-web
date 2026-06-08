ALTER TABLE "notes"
ADD COLUMN "placa" VARCHAR(16),
ADD COLUMN "motorista_nome" VARCHAR(120),
ADD COLUMN "motorista_telefone" VARCHAR(24);

CREATE INDEX "notes_placa_idx" ON "notes"("placa");
CREATE INDEX "notes_motorista_nome_idx" ON "notes"("motorista_nome");
