ALTER TABLE "campaign" ADD COLUMN "auto_pause_enabled" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "campaign" ADD COLUMN "pause_threshold" real DEFAULT 10;--> statement-breakpoint
ALTER TABLE "campaign" ADD COLUMN "notifications_enabled" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "campaign" ADD COLUMN "alert_check_interval" integer DEFAULT 300;