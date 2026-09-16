CREATE TABLE "sinter_feeds" (
  "id" UUID NOT NULL,
  "code" VARCHAR(120) NOT NULL,
  "description" VARCHAR(255),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sinter_feeds_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "blends" (
  "id" UUID NOT NULL,
  "code" VARCHAR(32) NOT NULL,
  "description" VARCHAR(255),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "blends_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "issuer_sinter_feed_mappings" (
  "id" UUID NOT NULL,
  "issuer_id" UUID NOT NULL,
  "sinter_feed_id" UUID NOT NULL,
  "blend_id" UUID NOT NULL,
  "starts_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ends_at" TIMESTAMP(3),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "issuer_sinter_feed_mappings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sinter_feeds_code_key" ON "sinter_feeds"("code");
CREATE UNIQUE INDEX "blends_code_key" ON "blends"("code");
CREATE INDEX "issuer_sinter_feed_mappings_issuer_id_sinter_feed_id_is_active_idx" ON "issuer_sinter_feed_mappings"("issuer_id", "sinter_feed_id", "is_active");
CREATE INDEX "issuer_sinter_feed_mappings_sinter_feed_id_idx" ON "issuer_sinter_feed_mappings"("sinter_feed_id");
CREATE INDEX "issuer_sinter_feed_mappings_blend_id_idx" ON "issuer_sinter_feed_mappings"("blend_id");
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE "issuer_sinter_feed_mappings"
  ADD CONSTRAINT "issuer_sinter_feed_mappings_no_active_overlap"
  EXCLUDE USING GIST (
    "issuer_id" WITH =,
    "sinter_feed_id" WITH =,
    tsrange("starts_at", COALESCE("ends_at", 'infinity'::timestamp), '[)') WITH &&
  ) WHERE ("is_active");

ALTER TABLE "records" ADD COLUMN "sinter_feed_value" VARCHAR(120), ADD COLUMN "issuer_sinter_feed_mapping_id" UUID;
CREATE INDEX "records_issuer_sinter_feed_mapping_id_idx" ON "records"("issuer_sinter_feed_mapping_id");

ALTER TABLE "issuer_sinter_feed_mappings" ADD CONSTRAINT "issuer_sinter_feed_mappings_issuer_id_fkey" FOREIGN KEY ("issuer_id") REFERENCES "issuers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "issuer_sinter_feed_mappings" ADD CONSTRAINT "issuer_sinter_feed_mappings_sinter_feed_id_fkey" FOREIGN KEY ("sinter_feed_id") REFERENCES "sinter_feeds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "issuer_sinter_feed_mappings" ADD CONSTRAINT "issuer_sinter_feed_mappings_blend_id_fkey" FOREIGN KEY ("blend_id") REFERENCES "blends"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "records" ADD CONSTRAINT "records_issuer_sinter_feed_mapping_id_fkey" FOREIGN KEY ("issuer_sinter_feed_mapping_id") REFERENCES "issuer_sinter_feed_mappings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
