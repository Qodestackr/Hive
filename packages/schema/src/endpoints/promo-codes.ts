import { z } from "zod";
import {
	BulkPromoCodeCreateSchema,
	BulkPromoCodeResponseSchema,
	PromoCodeCreateSchema,
	PromoCodeListQuerySchema,
	PromoCodeListResponseSchema,
	PromoCodeRedeemSchema,
	PromoCodeRedemptionResponseSchema,
	PromoCodeResponseSchema,
	PromoCodeValidateSchema,
	PromoCodeValidationResponseSchema,
} from "../campaigns/promo-code.schema.js";
import { registerRoute } from "../utils/route-builder.js";

// Redeem promo code (PROFIT CALCULATION AT REDEMPTION)
registerRoute({
	method: "post",
	path: "/api/v1/promo-codes/redeem",
	summary: "Redeem promo code",
	description:
		"Redeem a promo code and calculate actual profit using FIFO cost at time of redemption.",
	tags: ["Promo Codes", "Profit Intelligence"],
	body: PromoCodeRedeemSchema,
	response: PromoCodeRedemptionResponseSchema,
	errors: {
		400: "Invalid input data",
		404: "Promo code not found",
		410: "Promo code expired or already redeemed",
	},
});

// Validate promo code
registerRoute({
	method: "post",
	path: "/api/v1/promo-codes/validate",
	summary: "Validate promo code",
	description: "Check if a promo code is valid without redeeming it.",
	tags: ["Promo Codes"],
	body: PromoCodeValidateSchema,
	response: PromoCodeValidationResponseSchema,
	errors: {
		400: "Invalid input data",
	},
});

// Bulk create promo codes
registerRoute({
	method: "post",
	path: "/api/v1/promo-codes/bulk",
	summary: "Bulk create promo codes",
	description: "Generate multiple promo codes for a campaign.",
	tags: ["Promo Codes"],
	body: BulkPromoCodeCreateSchema,
	response: BulkPromoCodeResponseSchema,
	errors: {
		400: "Invalid input data",
		404: "Campaign not found",
	},
});

// Create single promo code
registerRoute({
	method: "post",
	path: "/api/v1/promo-codes",
	summary: "Create promo code",
	description: "Create a single promo code.",
	tags: ["Promo Codes"],
	body: PromoCodeCreateSchema,
	response: PromoCodeResponseSchema,
	errors: {
		400: "Invalid input data",
		409: "Promo code already exists",
	},
});

// List promo codes
registerRoute({
	method: "get",
	path: "/api/v1/promo-codes",
	summary: "List promo codes",
	description: "Get paginated list of promo codes with filtering.",
	tags: ["Promo Codes"],
	query: PromoCodeListQuerySchema,
	response: PromoCodeListResponseSchema,
	errors: {
		400: "Invalid query parameters",
	},
});

// Get promo code by ID
registerRoute({
	method: "get",
	path: "/api/v1/promo-codes/{id}",
	summary: "Get promo code by ID",
	description: "Get promo code details.",
	tags: ["Promo Codes"],
	params: z.object({
		id: z
			.string()
			.openapi({ param: { name: "id", in: "path" }, example: "promo_123" }),
	}),
	response: PromoCodeResponseSchema,
	errors: {
		404: "Promo code not found",
	},
});
