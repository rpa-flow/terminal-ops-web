ALTER TABLE "records"
ADD COLUMN "nota_chave" VARCHAR(255),
ADD COLUMN "emitente_cnpj" VARCHAR(32),
ADD COLUMN "emitente_fornecedor" VARCHAR(120),
ADD COLUMN "placa_recebimento" VARCHAR(32),
ADD COLUMN "recebimento_colaborador" VARCHAR(120),
ADD COLUMN "recebimento_peso" VARCHAR(32),
ADD COLUMN "recebimento_patio_descarga" VARCHAR(120),
ADD COLUMN "recebimento_data" VARCHAR(25),
ADD COLUMN "recebimento_placa" VARCHAR(32);
