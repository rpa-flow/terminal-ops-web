CREATE TABLE "purchase_order_rules" (
  "id" UUID NOT NULL,
  "material_id" VARCHAR(64) NOT NULL,
  "supplier_id" VARCHAR(64) NOT NULL,
  "purchase_order_code" VARCHAR(64) NOT NULL,
  "purchase_order_type" VARCHAR(32) NOT NULL,
  "description" VARCHAR(255),
  "lot" VARCHAR(64),
  "minimum_quantity" DECIMAL(18,4),
  "cost_center" VARCHAR(64),
  "payment_condition" VARCHAR(64),
  "currency" VARCHAR(16),
  "unit" VARCHAR(16),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "created_by" UUID NOT NULL,
  "updated_by" UUID NOT NULL,
  CONSTRAINT "purchase_order_rules_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "purchase_order_rule_histories" (
  "id" UUID NOT NULL,
  "purchase_order_rule_id" UUID NOT NULL,
  "action" VARCHAR(16) NOT NULL,
  "user_id" UUID NOT NULL,
  "before_data" JSONB,
  "after_data" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "purchase_order_rule_histories_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "purchase_order_rules_material_id_idx" ON "purchase_order_rules"("material_id");
CREATE INDEX "purchase_order_rules_supplier_id_idx" ON "purchase_order_rules"("supplier_id");
CREATE UNIQUE INDEX "purchase_order_rules_material_supplier_active_key" ON "purchase_order_rules"("material_id", "supplier_id", "is_active");
CREATE INDEX "purchase_order_rule_histories_purchase_order_rule_id_idx" ON "purchase_order_rule_histories"("purchase_order_rule_id");
ALTER TABLE "purchase_order_rule_histories" ADD CONSTRAINT "purchase_order_rule_histories_purchase_order_rule_id_fkey" FOREIGN KEY ("purchase_order_rule_id") REFERENCES "purchase_order_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
