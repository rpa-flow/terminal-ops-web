ALTER TABLE "shipments"
  ADD COLUMN "blend_id" UUID;

CREATE INDEX "shipments_blend_id_idx" ON "shipments"("blend_id");

ALTER TABLE "shipments"
  ADD CONSTRAINT "shipments_blend_id_fkey"
  FOREIGN KEY ("blend_id") REFERENCES "blends"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
