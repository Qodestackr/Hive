CREATE TYPE "public"."discount_type" AS ENUM('percentage', 'fixed');--> statement-breakpoint
ALTER TABLE "promo_code" ALTER COLUMN "cost_calculation_method" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."cost_calculation_method";--> statement-breakpoint
CREATE TYPE "public"."cost_calculation_method" AS ENUM('fifo', 'average', 'estimated');--> statement-breakpoint
ALTER TABLE "promo_code" ALTER COLUMN "cost_calculation_method" SET DATA TYPE "public"."cost_calculation_method" USING "cost_calculation_method"::"public"."cost_calculation_method";--> statement-breakpoint
ALTER TABLE "promo_code" ALTER COLUMN "discount_type" SET DATA TYPE "public"."discount_type" USING "discount_type"::"public"."discount_type";