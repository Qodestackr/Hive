CREATE TYPE "public"."business_type" AS ENUM('retailer', 'wholesaler', 'distributor', 'brand_owner');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."campaign_type" AS ENUM('flash_sale', 'loyalty_nudge', 'restock_alert', 'event_promo', 'dead_hour_boost', 'product_launch', 'reactivation');--> statement-breakpoint
CREATE TYPE "public"."payment_provider" AS ENUM('mpesa', 'coop_bank', 'polar', 'paystack');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('whatsapp', 'sms', 'email');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'trialing', 'past_due', 'unpaid', 'canceled', 'paused');--> statement-breakpoint
CREATE TYPE "public"."verification_method" AS ENUM('id_upload', 'show_at_pickup', 'manual_verification');--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"organization_id" text NOT NULL,
	"inviter_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"rejected_at" timestamp,
	"team_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"metadata" jsonb,
	"business_type" "business_type" DEFAULT 'retailer' NOT NULL,
	"license_number" text,
	"tax_id" text,
	"phone_number" text,
	"subscription_status" "subscription_status" DEFAULT 'trialing' NOT NULL,
	"pricing_version" text NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"base_price" real NOT NULL,
	"outcome_base_per_1000_captures" real DEFAULT 0,
	"outcome_profit_share_percent" real DEFAULT 0,
	"max_users" integer DEFAULT 1,
	"included_users" integer DEFAULT 1,
	"additional_user_price" real DEFAULT 0,
	"trial_ends_at" timestamp,
	"saleor_channel_id" text,
	"odoo_company_id" text,
	"settings" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organization_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "team_member" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"organization_id" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"number" text NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"base_charge" real NOT NULL,
	"outcome_charge" real DEFAULT 0,
	"additional_user_charge" real DEFAULT 0,
	"total_amount" real NOT NULL,
	"tax" real DEFAULT 0,
	"status" text DEFAULT 'draft' NOT NULL,
	"paid_at" timestamp,
	"due_date" timestamp NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoice_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "outcome_snapshot" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"invoice_id" text NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"captures_count" integer DEFAULT 0 NOT NULL,
	"conversions" integer DEFAULT 0 NOT NULL,
	"revenue" real DEFAULT 0 NOT NULL,
	"discount_cost" real DEFAULT 0 NOT NULL,
	"profit" real DEFAULT 0 NOT NULL,
	"campaign_breakdown" jsonb,
	"pricing_snapshot" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_id" text NOT NULL,
	"amount" real NOT NULL,
	"currency" text DEFAULT 'KES' NOT NULL,
	"provider" "payment_provider" NOT NULL,
	"provider_transaction_id" text,
	"provider_fee" real,
	"status" text DEFAULT 'pending' NOT NULL,
	"failure_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"type" "campaign_type" NOT NULL,
	"status" "campaign_status" DEFAULT 'draft' NOT NULL,
	"message_template" text NOT NULL,
	"platforms" jsonb DEFAULT '["whatsapp"]'::jsonb,
	"target_segment" jsonb,
	"target_radius" real,
	"target_product_ids" jsonb,
	"offer_type" text NOT NULL,
	"offer_value" real,
	"min_purchase_amount" real,
	"estimated_fifo_cost" real,
	"estimated_profit_per_redemption" real,
	"min_profit_threshold" real,
	"saleor_voucher_code" text,
	"max_redemptions" integer,
	"redemptions_used" integer DEFAULT 0,
	"scheduled_for" timestamp,
	"starts_at" timestamp,
	"ends_at" timestamp,
	"sent" integer DEFAULT 0,
	"delivered" integer DEFAULT 0,
	"opened" integer DEFAULT 0,
	"clicked" integer DEFAULT 0,
	"captures_count" integer DEFAULT 0,
	"conversions" integer DEFAULT 0,
	"revenue" real DEFAULT 0,
	"discount_cost" real DEFAULT 0,
	"total_cogs" real DEFAULT 0,
	"actual_profit" real DEFAULT 0,
	"avg_profit_per_redemption" real,
	"is_losing_money" boolean DEFAULT false,
	"budget_amount" real,
	"spent_amount" real DEFAULT 0,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promo_code" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"campaign_id" text,
	"customer_id" text,
	"product_id" text,
	"code" text NOT NULL,
	"discount_type" text NOT NULL,
	"discount_value" real NOT NULL,
	"is_redeemed" boolean DEFAULT false,
	"redeemed_at" timestamp,
	"saleor_order_id" text,
	"quantity_redeemed" integer DEFAULT 1,
	"original_price" real,
	"discount_amount" real,
	"net_revenue" real,
	"unit_cost_at_redemption" real,
	"total_cogs" real,
	"actual_profit" real,
	"is_profitable" boolean,
	"expires_at" timestamp NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "promo_code_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "campaign_response" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"platform" "platform" NOT NULL,
	"message_body" text,
	"is_converted" boolean DEFAULT false,
	"order_value" real,
	"promo_code_used" text,
	"saleor_order_id" text,
	"responded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_log" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"customer_id" text,
	"event_type" text NOT NULL,
	"description" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"phone_number" text NOT NULL,
	"name" text,
	"email" text,
	"is_age_verified" boolean DEFAULT false NOT NULL,
	"age_verification_method" "verification_method",
	"age_verified_at" timestamp,
	"date_of_birth" timestamp,
	"has_opted_in" boolean DEFAULT false NOT NULL,
	"opt_in_source" text,
	"opt_in_campaign_id" text,
	"opted_in_at" timestamp,
	"opted_out_at" timestamp,
	"tier" text DEFAULT 'bronze',
	"total_spend" real DEFAULT 0,
	"total_orders" integer DEFAULT 0,
	"last_order_at" timestamp,
	"city" text,
	"coordinates" jsonb,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"custom_fields" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"sku" text NOT NULL,
	"category" text,
	"description" text,
	"saleor_product_id" text,
	"saleor_variant_id" text,
	"saleor_channel_id" text,
	"base_price" real NOT NULL,
	"current_fifo_cost" real,
	"current_stock_quantity" integer DEFAULT 0,
	"reorder_point" integer DEFAULT 0,
	"lead_time_days" integer DEFAULT 7,
	"alcohol_content" real,
	"requires_age_verification" boolean DEFAULT true,
	"is_slow_mover" boolean DEFAULT false,
	"avg_margin_percent" real,
	"images" jsonb,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_order_item" (
	"id" text PRIMARY KEY NOT NULL,
	"purchase_order_id" text NOT NULL,
	"product_id" text NOT NULL,
	"quantity_ordered" integer NOT NULL,
	"quantity_received" integer DEFAULT 0,
	"unit_cost" real NOT NULL,
	"batch_number" text,
	"expiry_date" timestamp,
	"line_total" real NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_order" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"po_number" text NOT NULL,
	"supplier_name" text,
	"supplier_contact" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"order_date" timestamp NOT NULL,
	"received_date" timestamp,
	"total_cost" real NOT NULL,
	"currency" text DEFAULT 'KES' NOT NULL,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_movement" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"product_id" text NOT NULL,
	"movement_type" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_cost_at_movement" real NOT NULL,
	"total_cost" real NOT NULL,
	"fifo_batch_id" text,
	"reference_type" text,
	"reference_id" text,
	"campaign_id" text,
	"promo_code_id" text,
	"stock_after_movement" integer NOT NULL,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promo_profit_alert" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"campaign_id" text NOT NULL,
	"product_id" text,
	"alert_type" text NOT NULL,
	"severity" text NOT NULL,
	"message" text NOT NULL,
	"current_fifo_cost" real,
	"discount_percent" real,
	"redemptions_count" integer,
	"total_loss" real,
	"estimated_loss_per_redemption" real,
	"is_resolved" boolean DEFAULT false,
	"action_taken" text,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_contact" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"customer_id" text,
	"wa_id" text NOT NULL,
	"profile_name" text,
	"last_message_at" timestamp,
	"is_blocked" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_message" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"contact_id" text NOT NULL,
	"campaign_id" text,
	"wa_message_id" text,
	"direction" text NOT NULL,
	"body" text,
	"media_url" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"error_code" text,
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outcome_snapshot" ADD CONSTRAINT "outcome_snapshot_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign" ADD CONSTRAINT "campaign_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_code" ADD CONSTRAINT "promo_code_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_code" ADD CONSTRAINT "promo_code_campaign_id_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaign"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_code" ADD CONSTRAINT "promo_code_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_code" ADD CONSTRAINT "promo_code_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_response" ADD CONSTRAINT "campaign_response_campaign_id_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaign"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_response" ADD CONSTRAINT "campaign_response_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_log" ADD CONSTRAINT "compliance_log_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_log" ADD CONSTRAINT "compliance_log_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer" ADD CONSTRAINT "customer_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_item" ADD CONSTRAINT "purchase_order_item_purchase_order_id_purchase_order_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_item" ADD CONSTRAINT "purchase_order_item_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movement" ADD CONSTRAINT "inventory_movement_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movement" ADD CONSTRAINT "inventory_movement_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movement" ADD CONSTRAINT "inventory_movement_fifo_batch_id_purchase_order_item_id_fk" FOREIGN KEY ("fifo_batch_id") REFERENCES "public"."purchase_order_item"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movement" ADD CONSTRAINT "inventory_movement_campaign_id_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaign"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movement" ADD CONSTRAINT "inventory_movement_promo_code_id_promo_code_id_fk" FOREIGN KEY ("promo_code_id") REFERENCES "public"."promo_code"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_profit_alert" ADD CONSTRAINT "promo_profit_alert_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_profit_alert" ADD CONSTRAINT "promo_profit_alert_campaign_id_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaign"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_profit_alert" ADD CONSTRAINT "promo_profit_alert_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_contact" ADD CONSTRAINT "whatsapp_contact_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_contact" ADD CONSTRAINT "whatsapp_contact_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_message" ADD CONSTRAINT "whatsapp_message_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_message" ADD CONSTRAINT "whatsapp_message_contact_id_whatsapp_contact_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."whatsapp_contact"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_message" ADD CONSTRAINT "whatsapp_message_campaign_id_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaign"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invitation_email_org_idx" ON "invitation" USING btree ("email","organization_id");--> statement-breakpoint
CREATE INDEX "invitation_status_idx" ON "invitation" USING btree ("status");--> statement-breakpoint
CREATE INDEX "invitation_org_idx" ON "invitation" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "member_user_org_idx" ON "member" USING btree ("user_id","organization_id");--> statement-breakpoint
CREATE INDEX "member_org_idx" ON "member" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "org_slug_idx" ON "organization" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "org_business_type_idx" ON "organization" USING btree ("business_type");--> statement-breakpoint
CREATE INDEX "org_subscription_status_idx" ON "organization" USING btree ("subscription_status");--> statement-breakpoint
CREATE UNIQUE INDEX "team_member_user_team_idx" ON "team_member" USING btree ("user_id","team_id");--> statement-breakpoint
CREATE INDEX "team_member_team_idx" ON "team_member" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_member_user_idx" ON "team_member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "team_org_idx" ON "team" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "team_name_org_idx" ON "team" USING btree ("name","organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invoice_number_idx" ON "invoice" USING btree ("number");--> statement-breakpoint
CREATE INDEX "invoice_org_idx" ON "invoice" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "invoice_status_idx" ON "invoice" USING btree ("status");--> statement-breakpoint
CREATE INDEX "invoice_due_idx" ON "invoice" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "outcome_snapshot_invoice_idx" ON "outcome_snapshot" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "outcome_snapshot_org_idx" ON "outcome_snapshot" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "outcome_snapshot_period_idx" ON "outcome_snapshot" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "payment_invoice_idx" ON "payment" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "payment_status_idx" ON "payment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payment_provider_tx_idx" ON "payment" USING btree ("provider_transaction_id");--> statement-breakpoint
CREATE INDEX "campaign_org_idx" ON "campaign" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "campaign_status_idx" ON "campaign" USING btree ("status");--> statement-breakpoint
CREATE INDEX "campaign_scheduled_idx" ON "campaign" USING btree ("scheduled_for");--> statement-breakpoint
CREATE UNIQUE INDEX "promo_code_idx" ON "promo_code" USING btree ("code");--> statement-breakpoint
CREATE INDEX "promo_customer_idx" ON "promo_code" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "promo_product_idx" ON "promo_code" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "promo_redeemed_idx" ON "promo_code" USING btree ("is_redeemed");--> statement-breakpoint
CREATE INDEX "promo_expires_idx" ON "promo_code" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "promo_profitable_idx" ON "promo_code" USING btree ("is_profitable");--> statement-breakpoint
CREATE INDEX "response_campaign_idx" ON "campaign_response" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "response_customer_idx" ON "campaign_response" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "response_converted_idx" ON "campaign_response" USING btree ("is_converted");--> statement-breakpoint
CREATE INDEX "compliance_log_org_idx" ON "compliance_log" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "compliance_log_customer_idx" ON "compliance_log" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "compliance_log_event_type_idx" ON "compliance_log" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "compliance_log_created_idx" ON "compliance_log" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_phone_org_idx" ON "customer" USING btree ("phone_number","organization_id");--> statement-breakpoint
CREATE INDEX "customer_org_idx" ON "customer" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "customer_opt_in_idx" ON "customer" USING btree ("has_opted_in");--> statement-breakpoint
CREATE INDEX "customer_age_verified_idx" ON "customer" USING btree ("is_age_verified");--> statement-breakpoint
CREATE UNIQUE INDEX "product_org_sku_idx" ON "product" USING btree ("organization_id","sku");--> statement-breakpoint
CREATE INDEX "product_saleor_product_idx" ON "product" USING btree ("saleor_product_id");--> statement-breakpoint
CREATE INDEX "product_saleor_variant_idx" ON "product" USING btree ("saleor_variant_id");--> statement-breakpoint
CREATE INDEX "product_category_idx" ON "product" USING btree ("category");--> statement-breakpoint
CREATE INDEX "purchase_order_item_po_idx" ON "purchase_order_item" USING btree ("purchase_order_id");--> statement-breakpoint
CREATE INDEX "purchase_order_item_product_idx" ON "purchase_order_item" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "purchase_order_item_batch_idx" ON "purchase_order_item" USING btree ("batch_number");--> statement-breakpoint
CREATE INDEX "purchase_order_item_expiry_idx" ON "purchase_order_item" USING btree ("expiry_date");--> statement-breakpoint
CREATE UNIQUE INDEX "purchase_order_org_po_number_idx" ON "purchase_order" USING btree ("organization_id","po_number");--> statement-breakpoint
CREATE INDEX "purchase_order_org_idx" ON "purchase_order" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "purchase_order_status_idx" ON "purchase_order" USING btree ("status");--> statement-breakpoint
CREATE INDEX "purchase_order_order_date_idx" ON "purchase_order" USING btree ("order_date");--> statement-breakpoint
CREATE INDEX "inventory_movement_org_idx" ON "inventory_movement" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "inventory_movement_product_idx" ON "inventory_movement" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "inventory_movement_type_idx" ON "inventory_movement" USING btree ("movement_type");--> statement-breakpoint
CREATE INDEX "inventory_movement_campaign_idx" ON "inventory_movement" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "inventory_movement_promo_code_idx" ON "inventory_movement" USING btree ("promo_code_id");--> statement-breakpoint
CREATE INDEX "inventory_movement_created_idx" ON "inventory_movement" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "promo_profit_alert_org_idx" ON "promo_profit_alert" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "promo_profit_alert_campaign_idx" ON "promo_profit_alert" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "promo_profit_alert_severity_idx" ON "promo_profit_alert" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "promo_profit_alert_resolved_idx" ON "promo_profit_alert" USING btree ("is_resolved");--> statement-breakpoint
CREATE UNIQUE INDEX "whatsapp_contact_waid_org_idx" ON "whatsapp_contact" USING btree ("wa_id","organization_id");--> statement-breakpoint
CREATE INDEX "whatsapp_contact_customer_idx" ON "whatsapp_contact" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "whatsapp_message_contact_idx" ON "whatsapp_message" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "whatsapp_message_campaign_idx" ON "whatsapp_message" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "whatsapp_message_status_idx" ON "whatsapp_message" USING btree ("status");