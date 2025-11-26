import { z } from "zod";

export const BusinessType = z.enum([
	"retailer",
	"wholesaler",
	"distributor",
	"brand_owner",
]);

export const SubscriptionStatus = z.enum([
	"active",
	"trialing",
	"past_due",
	"unpaid",
	"canceled",
	"paused",
]);

export const PaymentProvider = z.enum([
	"mpesa",
	"coop_bank",
	"stripe",
	"paystack",
]);

export const CampaignStatus = z.enum([
	"draft",
	"scheduled",
	"active",
	"paused",
	"completed",
	"cancelled",
]);

export const CampaignType = z.enum([
	"flash_sale",
	"loyalty_nudge",
	"restock_alert",
	"event_promo",
	"dead_hour_boost",
	"product_launch",
	"reactivation",
]);

export const Platform = z.enum(["whatsapp", "sms", "email"]);

export const VerificationMethod = z.enum([
	"id_upload",
	"show_at_pickup",
	"manual_verification",
]);

export const InventoryMovementType = z.enum([
	"purchase",
	"sale",
	"adjustment",
	"promo_redemption",
	"return",
	"damage",
	"theft",
]);

export const PurchaseOrderStatus = z.enum([
	"draft",
	"ordered",
	"received",
	"cancelled",
]);

export const PromoCodeDiscountType = z.enum(["percentage", "fixed_amount"]);

export const AlertType = z.enum([
	"negative_margin",
	"low_stock",
	"cost_spike",
	"profit_threshold_breach",
]);

export const AlertSeverity = z.enum(["critical", "warning", "info"]);

export type BusinessType = z.infer<typeof BusinessType>;
export type SubscriptionStatus = z.infer<typeof SubscriptionStatus>;
export type PaymentProvider = z.infer<typeof PaymentProvider>;
export type CampaignStatus = z.infer<typeof CampaignStatus>;
export type CampaignType = z.infer<typeof CampaignType>;
export type Platform = z.infer<typeof Platform>;
export type VerificationMethod = z.infer<typeof VerificationMethod>;
export type InventoryMovementType = z.infer<typeof InventoryMovementType>;
export type PurchaseOrderStatus = z.infer<typeof PurchaseOrderStatus>;
export type PromoCodeDiscountType = z.infer<typeof PromoCodeDiscountType>;
export type AlertType = z.infer<typeof AlertType>;
export type AlertSeverity = z.infer<typeof AlertSeverity>;
