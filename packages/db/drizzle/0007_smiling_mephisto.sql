CREATE TABLE "saleor_channel" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"saleor_channel_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"currency_code" text DEFAULT 'KES' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "saleor_channel_saleor_channel_id_unique" UNIQUE("saleor_channel_id"),
	CONSTRAINT "saleor_channel_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "warehouse" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"saleor_warehouse_id" text NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"city" text,
	"country" text DEFAULT 'KE',
	"postal_code" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "warehouse_saleor_warehouse_id_unique" UNIQUE("saleor_warehouse_id")
);
--> statement-breakpoint
ALTER TABLE "saleor_channel" ADD CONSTRAINT "saleor_channel_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse" ADD CONSTRAINT "warehouse_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "saleor_channel_org_idx" ON "saleor_channel" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "saleor_channel_saleor_id_idx" ON "saleor_channel" USING btree ("saleor_channel_id");--> statement-breakpoint
CREATE INDEX "saleor_channel_active_idx" ON "saleor_channel" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "warehouse_org_idx" ON "warehouse" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "warehouse_saleor_id_idx" ON "warehouse" USING btree ("saleor_warehouse_id");--> statement-breakpoint
CREATE INDEX "warehouse_primary_idx" ON "warehouse" USING btree ("is_primary");--> statement-breakpoint
CREATE INDEX "warehouse_active_idx" ON "warehouse" USING btree ("is_active");