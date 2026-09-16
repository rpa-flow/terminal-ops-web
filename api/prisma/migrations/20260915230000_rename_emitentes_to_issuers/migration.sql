ALTER TABLE "emitentes" RENAME TO "issuers";
ALTER TABLE "issuers" RENAME CONSTRAINT "emitentes_pkey" TO "issuers_pkey";
ALTER INDEX "emitentes_cnpj_key" RENAME TO "issuers_cnpj_key";

ALTER TABLE "records" RENAME COLUMN "emitente_id" TO "issuer_id";
ALTER INDEX "records_emitente_id_idx" RENAME TO "records_issuer_id_idx";
ALTER TABLE "records" RENAME CONSTRAINT "records_emitente_id_fkey" TO "records_issuer_id_fkey";
