ALTER TABLE "records"
ADD COLUMN "nota_pesagem_id" VARCHAR(64) NOT NULL DEFAULT '';

UPDATE "records"
SET "nota_pesagem_id" = "numero_nota"
WHERE "nota_pesagem_id" = '';

ALTER TABLE "records"
ALTER COLUMN "nota_pesagem_id" DROP DEFAULT;
