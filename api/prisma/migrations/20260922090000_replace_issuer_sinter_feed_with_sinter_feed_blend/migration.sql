UPDATE "records" SET "issuer_sinter_feed_mapping_id" = NULL;
DELETE FROM "issuer_sinter_feed_mappings";
ALTER TABLE "records" DROP CONSTRAINT IF EXISTS "records_issuer_sinter_feed_mapping_id_fkey";
DROP INDEX IF EXISTS "records_issuer_sinter_feed_mapping_id_idx";
ALTER TABLE "records" DROP COLUMN IF EXISTS "issuer_sinter_feed_mapping_id";
DROP TABLE IF EXISTS "issuer_sinter_feed_mappings";

CREATE TABLE "sinter_feed_blend_mappings" (
  "id" UUID NOT NULL,
  "sinter_feed_id" UUID NOT NULL,
  "blend_id" UUID NOT NULL,
  "starts_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ends_at" TIMESTAMP(3),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sinter_feed_blend_mappings_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "sinter_feed_blend_mappings_sinter_feed_id_is_active_idx" ON "sinter_feed_blend_mappings"("sinter_feed_id", "is_active");
CREATE INDEX "sinter_feed_blend_mappings_blend_id_idx" ON "sinter_feed_blend_mappings"("blend_id");
ALTER TABLE "sinter_feed_blend_mappings" ADD CONSTRAINT "sinter_feed_blend_mappings_sinter_feed_id_fkey" FOREIGN KEY ("sinter_feed_id") REFERENCES "sinter_feeds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sinter_feed_blend_mappings" ADD CONSTRAINT "sinter_feed_blend_mappings_blend_id_fkey" FOREIGN KEY ("blend_id") REFERENCES "blends"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sinter_feed_blend_mappings" ADD CONSTRAINT "sinter_feed_blend_mappings_no_active_overlap" EXCLUDE USING gist ("sinter_feed_id" WITH =, tsrange("starts_at", COALESCE("ends_at", 'infinity'::timestamp), '[)'::text) WITH =) WHERE ("is_active" = true);
ALTER TABLE "records" ADD COLUMN "sinter_feed_blend_mapping_id" UUID;
CREATE INDEX "records_sinter_feed_blend_mapping_id_idx" ON "records"("sinter_feed_blend_mapping_id");
ALTER TABLE "records" ADD CONSTRAINT "records_sinter_feed_blend_mapping_id_fkey" FOREIGN KEY ("sinter_feed_blend_mapping_id") REFERENCES "sinter_feed_blend_mappings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
