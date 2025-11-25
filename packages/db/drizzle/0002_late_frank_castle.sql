CREATE INDEX "campaign_org_status_idx" ON "campaign" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "campaign_scheduled_status_idx" ON "campaign" USING btree ("scheduled_for","status");--> statement-breakpoint
CREATE INDEX "promo_org_redeemed_idx" ON "promo_code" USING btree ("organization_id","is_redeemed");--> statement-breakpoint
CREATE INDEX "promo_redeemed_date_idx" ON "promo_code" USING btree ("redeemed_at");--> statement-breakpoint
CREATE INDEX "purchase_order_item_product_created_idx" ON "purchase_order_item" USING btree ("product_id","created_at");--> statement-breakpoint
CREATE INDEX "inventory_movement_product_date_idx" ON "inventory_movement" USING btree ("product_id","created_at");--> statement-breakpoint
CREATE INDEX "inventory_movement_org_type_idx" ON "inventory_movement" USING btree ("organization_id","movement_type");