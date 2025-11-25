CREATE TABLE "audit_events" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"event_type" text NOT NULL,
	"aggregate_type" text NOT NULL,
	"aggregate_id" text NOT NULL,
	"event_data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE INDEX "idx_audit_events_org_type" ON "audit_events" USING btree ("organization_id","event_type");--> statement-breakpoint
CREATE INDEX "idx_audit_events_aggregate" ON "audit_events" USING btree ("aggregate_type","aggregate_id");--> statement-breakpoint
CREATE INDEX "idx_audit_events_created_at" ON "audit_events" USING btree ("created_at");