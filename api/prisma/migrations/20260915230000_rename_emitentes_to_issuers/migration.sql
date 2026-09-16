DO $$
BEGIN
  IF to_regclass('public.emitentes') IS NOT NULL AND to_regclass('public.issuers') IS NULL THEN
    ALTER TABLE "emitentes" RENAME TO "issuers";
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.issuers'::regclass AND conname = 'emitentes_pkey'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.issuers'::regclass AND conname = 'issuers_pkey'
  ) THEN
    ALTER TABLE "issuers" RENAME CONSTRAINT "emitentes_pkey" TO "issuers_pkey";
  END IF;

  IF to_regclass('public.emitentes_cnpj_key') IS NOT NULL AND to_regclass('public.issuers_cnpj_key') IS NULL THEN
    ALTER INDEX "emitentes_cnpj_key" RENAME TO "issuers_cnpj_key";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'records' AND column_name = 'emitente_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'records' AND column_name = 'issuer_id'
  ) THEN
    ALTER TABLE "records" RENAME COLUMN "emitente_id" TO "issuer_id";
  END IF;

  IF to_regclass('public.records_emitente_id_idx') IS NOT NULL AND to_regclass('public.records_issuer_id_idx') IS NULL THEN
    ALTER INDEX "records_emitente_id_idx" RENAME TO "records_issuer_id_idx";
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.records'::regclass AND conname = 'records_emitente_id_fkey'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.records'::regclass AND conname = 'records_issuer_id_fkey'
  ) THEN
    ALTER TABLE "records" RENAME CONSTRAINT "records_emitente_id_fkey" TO "records_issuer_id_fkey";
  END IF;
END $$;
