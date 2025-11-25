CREATE TYPE "public"."cost_calculation_method" AS ENUM('fifo', 'weighted_average', 'fallback');--> statement-breakpoint
CREATE TABLE "reconciliation_log" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"product_id" text NOT NULL,
	"expected_quantity" integer NOT NULL,
	"actual_quantity" integer NOT NULL,
	"discrepancy" integer NOT NULL,
	"is_resolved" boolean DEFAULT false,
	"resolved_at" timestamp,
	"resolution_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "promo_code" ADD COLUMN "cost_calculation_method" "cost_calculation_method";--> statement-breakpoint
ALTER TABLE "reconciliation_log" ADD CONSTRAINT "reconciliation_log_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliation_log" ADD CONSTRAINT "reconciliation_log_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reconciliation_log_org_idx" ON "reconciliation_log" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "reconciliation_log_product_idx" ON "reconciliation_log" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "reconciliation_log_unresolved_idx" ON "reconciliation_log" USING btree ("is_resolved");