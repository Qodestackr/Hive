import { z } from "zod";
import { ID, Timestamps } from "../shared/base.schema.js";
import { PromoCodeDiscountType } from "../shared/enums.schema.js";

export const PromoCodeSchema = z
	.object({
		id: z.string(),
		organizationId: z.string(),
		campaignId: z.string().nullable(),
		customerId: z.string().nullable(),
		productId: z.string().nullable(),
		code: z.string(),
		discountType: PromoCodeDiscountType,
		discountValue: z.number().nonnegative(),
		isRedeemed: z.boolean().default(false),
		redeemedAt: z.string().datetime().nullable(),
		saleorOrderId: z.string().nullable(),
		quantityRedeemed: z.number().int().positive().default(1),
		originalPrice: z.number().nonnegative().nullable(),
		discountAmount: z.number().nonnegative().nullable(),
		netRevenue: z.number().nonnegative().nullable(),
		unitCostAtRedemption: z.number().nonnegative().nullable(),
		totalCOGS: z.number().nonnegative().nullable(),
		actualProfit: z.number().nullable(),
		isProfitable: z.boolean().nullable(),
		expiresAt: z.string().datetime(),
		metadata: z.record(z.string(), z.any()).nullable(),
		createdAt: z.string().datetime(),
	})
	.openapi("PromoCode");

export const PromoCodeCreateSchema = z
	.object({
		campaignId: z.string().optional(),
		customerId: z.string().optional(),
		productId: z.string().optional(),
		code: z
			.string()
			.min(1, "Promo code is required")
			.optional()
			.openapi({ example: "HENNY20-ABC123" }),
		discountType: PromoCodeDiscountType,
		discountValue: z
			.number()
			.nonnegative("Discount value must be non-negative")
			.openapi({ example: 20 }),
		expiresAt: z.string().datetime(),
		metadata: z.record(z.string(), z.any()).optional(),
	})
	.openapi("PromoCodeCreate");

export const BulkPromoCodeCreateSchema = z
	.object({
		campaignId: z.string().min(1, "Campaign ID is required"),
		productId: z.string().optional(),
		discountType: PromoCodeDiscountType,
		discountValue: z
			.number()
			.nonnegative("Discount value must be non-negative")
			.openapi({ example: 20 }),
		expiresAt: z.string().datetime(),
		customerIds: z
			.array(z.string())
			.min(1, "At least one customer ID is required"),
		codePrefix: z.string().optional().openapi({ example: "HENNY20" }),
		codeLength: z.number().int().min(4).max(20).default(8),
	})
	.openapi("BulkPromoCodeCreate");

export const PromoCodeRedeemSchema = z
	.object({
		code: z
			.string()
			.min(1, "Promo code is required")
			.openapi({ example: "HENNY20-ABC123" }),
		saleorOrderId: z.string().optional(),
		quantityRedeemed: z.number().int().positive().default(1),
		originalPrice: z
			.number()
			.nonnegative("Original price is required")
			.openapi({ example: 11000 }),
	})
	.openapi("PromoCodeRedeem");

export const PromoCodeRedemptionResponseSchema = z
	.object({
		success: z.boolean(),
		promoCode: PromoCodeSchema,
		discountAmount: z.number().nonnegative(),
		netRevenue: z.number().nonnegative(),
		unitCostAtRedemption: z.number().nonnegative(),
		actualProfit: z.number(),
		isProfitable: z.boolean(),
		message: z.string().optional(),
	})
	.openapi("PromoCodeRedemptionResponse");

export const PromoCodeValidateSchema = z
	.object({
		code: z
			.string()
			.min(1, "Promo code is required")
			.openapi({ example: "HENNY20-ABC123" }),
		customerId: z.string().optional(),
	})
	.openapi("PromoCodeValidate");

export const PromoCodeValidationResponseSchema = z
	.object({
		isValid: z.boolean(),
		promoCode: PromoCodeSchema.optional(),
		reason: z.string().optional(),
	})
	.openapi("PromoCodeValidationResponse");

export const PromoCodeListQuerySchema = z
	.object({
		page: z.coerce.number().int().positive().default(1),
		limit: z.coerce.number().int().positive().max(100).default(20),
		campaignId: z.string().optional(),
		customerId: z.string().optional(),
		productId: z.string().optional(),
		isRedeemed: z.coerce.boolean().optional(),
		isProfitable: z.coerce.boolean().optional(),
		sortBy: z
			.enum(["code", "createdAt", "redeemedAt", "actualProfit"])
			.default("createdAt"),
		sortOrder: z.enum(["asc", "desc"]).default("desc"),
	})
	.openapi("PromoCodeListQuery");

export const PromoCodeResponseSchema =
	PromoCodeSchema.openapi("PromoCodeResponse");

export const PromoCodeListResponseSchema = z
	.object({
		data: z.array(PromoCodeResponseSchema),
		pagination: z.object({
			page: z.number(),
			limit: z.number(),
			total: z.number(),
			totalPages: z.number(),
		}),
	})
	.openapi("PromoCodeListResponse");

export const BulkPromoCodeResponseSchema = z
	.object({
		success: z.boolean(),
		codesGenerated: z.number().int().nonnegative(),
		codes: z.array(PromoCodeResponseSchema),
	})
	.openapi("BulkPromoCodeResponse");

export const PromoCodeValidateQuerySchema = z.object({
	code: z.string().min(1, "Promo code is required"),
});

export const PromoCodeValidateResponseSchema = z.object({
	code: z.string(),
	productId: z.string().nullable(),
	discountType: z.enum(["percentage", "fixed"]),
	discountValue: z.number(),
	expiresAt: z.string(),
	campaignId: z.string().nullable(),
	isValid: z.literal(true), // Only returns on success
});

export type PromoCode = z.infer<typeof PromoCodeSchema>;
export type PromoCodeCreate = z.infer<typeof PromoCodeCreateSchema>;
export type BulkPromoCodeCreate = z.infer<typeof BulkPromoCodeCreateSchema>;
export type PromoCodeRedeem = z.infer<typeof PromoCodeRedeemSchema>;
export type PromoCodeRedemptionResponse = z.infer<
	typeof PromoCodeRedemptionResponseSchema
>;
export type PromoCodeValidate = z.infer<typeof PromoCodeValidateSchema>;
export type PromoCodeValidationResponse = z.infer<
	typeof PromoCodeValidationResponseSchema
>;
export type PromoCodeListQuery = z.infer<typeof PromoCodeListQuerySchema>;
export type PromoCodeResponse = z.infer<typeof PromoCodeResponseSchema>;
export type PromoCodeListResponse = z.infer<typeof PromoCodeListResponseSchema>;
export type BulkPromoCodeResponse = z.infer<typeof BulkPromoCodeResponseSchema>;
export type PromoCodeValidateQuery = z.infer<
	typeof PromoCodeValidateQuerySchema
>;
export type PromoCodeValidateResponse = z.infer<
	typeof PromoCodeValidateResponseSchema
>;
