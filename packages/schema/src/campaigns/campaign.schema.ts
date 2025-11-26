import { z } from "zod";
import { ID, Timestamps } from "../shared/base.schema.js";
import {
	CampaignStatus,
	CampaignType,
	Platform,
} from "../shared/enums.schema.js";

export const CampaignTargetSegmentSchema = z
	.object({
		tiers: z.array(z.string()).optional(),
		minSpend: z.number().nonnegative().optional(),
		cities: z.array(z.string()).optional(),
		tags: z.array(z.string()).optional(),
		lastOrderDaysAgo: z.number().int().nonnegative().optional(),
	})
	.openapi("CampaignTargetSegment");

export const CampaignSchema = z
	.object({
		id: z.string(),
		organizationId: z.string(),
		name: z.string(),
		type: CampaignType,
		status: CampaignStatus,
		messageTemplate: z.string(),
		platforms: z.array(Platform).default(["whatsapp"]),
		targetSegment: CampaignTargetSegmentSchema.nullable(),
		targetRadius: z.number().nonnegative().nullable(),
		targetProductIds: z.array(z.string()).nullable(),
		offerType: z.string(),
		offerValue: z.number().nullable(),
		minPurchaseAmount: z.number().nonnegative().nullable(),
		estimatedFIFOCost: z.number().nonnegative().nullable(),
		estimatedProfitPerRedemption: z.number().nullable(),
		minProfitThreshold: z.number().nullable(),
		saleorVoucherCode: z.string().nullable(),
		maxRedemptions: z.number().int().nonnegative().nullable(),
		redemptionsUsed: z.number().int().nonnegative().default(0),
		scheduledFor: z.string().datetime().nullable(),
		startsAt: z.string().datetime().nullable(),
		endsAt: z.string().datetime().nullable(),
		sent: z.number().int().nonnegative().default(0),
		delivered: z.number().int().nonnegative().default(0),
		opened: z.number().int().nonnegative().default(0),
		clicked: z.number().int().nonnegative().default(0),
		capturesCount: z.number().int().nonnegative().default(0),
		conversions: z.number().int().nonnegative().default(0),
		revenue: z.number().nonnegative().default(0),
		discountCost: z.number().nonnegative().default(0),
		totalCOGS: z.number().nonnegative().default(0),
		actualProfit: z.number().default(0),
		avgProfitPerRedemption: z.number().nullable(),
		isLosingMoney: z.boolean().default(false),
		budgetAmount: z.number().nonnegative().nullable(),
		spentAmount: z.number().nonnegative().default(0),
		metadata: z.record(z.string(), z.any()).nullable(),
	})
	.merge(Timestamps)
	.openapi("Campaign");

export const CampaignCreateSchema = z
	.object({
		name: z
			.string()
			.min(1, "Campaign name is required")
			.openapi({ example: "Weekend Flash Sale" }),
		type: CampaignType,
		messageTemplate: z
			.string()
			.min(1, "Message template is required")
			.openapi({ example: "Get 20% off Hennessy this weekend!" }),
		platforms: z.array(Platform).default(["whatsapp"]),
		targetSegment: CampaignTargetSegmentSchema.optional(),
		targetRadius: z.number().nonnegative().optional(),
		targetProductIds: z.array(z.string()).optional(),
		offerType: z.enum([
			"percentage_discount",
			"fixed_discount",
			"buy_x_get_y",
			"free_delivery",
		]),
		offerValue: z.number().nonnegative().optional().openapi({ example: 20 }),
		minPurchaseAmount: z.number().nonnegative().optional(),
		minProfitThreshold: z.number().optional(),
		scheduledFor: z.string().datetime().optional(),
		startsAt: z.string().datetime().optional(),
		endsAt: z.string().datetime().optional(),
		maxRedemptions: z
			.number()
			.int()
			.positive()
			.optional()
			.openapi({ example: 100 }),
		budgetAmount: z.number().nonnegative().optional(),
	})
	.openapi("CampaignCreate");

export const CampaignUpdateSchema = CampaignCreateSchema.partial()
	.extend({
		status: CampaignStatus.optional(),
	})
	.openapi("CampaignUpdate");

export const CampaignListQuerySchema = z
	.object({
		page: z.coerce.number().int().positive().default(1),
		limit: z.coerce.number().int().positive().max(100).default(20),
		status: CampaignStatus.optional(),
		type: CampaignType.optional(),
		isLosingMoney: z.coerce.boolean().optional(),
		startDate: z.string().datetime().optional(),
		endDate: z.string().datetime().optional(),
		sortBy: z
			.enum(["name", "status", "actualProfit", "capturesCount", "createdAt"])
			.default("createdAt"),
		sortOrder: z.enum(["asc", "desc"]).default("desc"),
	})
	.openapi("CampaignListQuery");

export const CampaignResponseSchema =
	CampaignSchema.openapi("CampaignResponse");

export const CampaignListResponseSchema = z
	.object({
		data: z.array(CampaignResponseSchema),
		pagination: z.object({
			page: z.number(),
			limit: z.number(),
			total: z.number(),
			totalPages: z.number(),
		}),
	})
	.openapi("CampaignListResponse");

export const CampaignProfitabilityCheckSchema = z
	.object({
		productId: z
			.string()
			.min(1, "Product ID is required")
			.openapi({ example: "prod_123" }),
		discountPercent: z
			.number()
			.min(0)
			.max(100, "Discount must be between 0-100%")
			.openapi({ example: 20 }),
		discountAmount: z.number().nonnegative().optional(),
	})
	.openapi("CampaignProfitabilityCheck");

export const CampaignProfitabilityResponseSchema = z
	.object({
		isProfitable: z.boolean(),
		estimatedProfit: z.number(),
		estimatedProfitPercent: z.number(),
		basePrice: z.number().nonnegative(),
		discountAmount: z.number().nonnegative(),
		netRevenue: z.number().nonnegative(),
		currentFIFOCost: z.number().nonnegative(),
		recommendation: z.string().optional(),
		suggestedDiscount: z.number().optional(),
		alternativeProducts: z
			.array(
				z.object({
					productId: z.string(),
					productName: z.string(),
					suggestedDiscount: z.number(),
					estimatedProfit: z.number(),
					reason: z.string(),
				}),
			)
			.optional(),
	})
	.openapi("CampaignProfitabilityResponse");

export const CampaignStatsSchema = z
	.object({
		campaignId: z.string(),
		campaignName: z.string(),
		status: CampaignStatus,
		sent: z.number().int().nonnegative(),
		delivered: z.number().int().nonnegative(),
		opened: z.number().int().nonnegative(),
		clicked: z.number().int().nonnegative(),
		conversions: z.number().int().nonnegative(),
		capturesCount: z.number().int().nonnegative(),
		revenue: z.number().nonnegative(),
		discountCost: z.number().nonnegative(),
		totalCOGS: z.number().nonnegative(),
		actualProfit: z.number(),
		avgProfitPerRedemption: z.number().nullable(),
		deliveryRate: z.number(),
		openRate: z.number(),
		clickRate: z.number(),
		conversionRate: z.number(),
		roi: z.number(),
	})
	.openapi("CampaignStats");

export const CampaignGenerateCodesSchema = z
	.object({
		count: z.number().int().positive().max(1000).openapi({ example: 100 }),
	})
	.openapi("CampaignGenerateCodes");

export const CampaignGenerateCodesResponseSchema = z
	.object({
		success: z.boolean(),
		generated: z.number(),
		codes: z.array(z.string()),
	})
	.openapi("CampaignGenerateCodesResponse");

export const CampaignExportCodesResponseSchema = z
	.object({
		csv: z.string(),
		totalCodes: z.number(),
		redeemedCodes: z.number(),
	})
	.openapi("CampaignExportCodesResponse");

export type CampaignTargetSegment = z.infer<typeof CampaignTargetSegmentSchema>;
export type Campaign = z.infer<typeof CampaignSchema>;
export type CampaignCreate = z.infer<typeof CampaignCreateSchema>;
export type CampaignUpdate = z.infer<typeof CampaignUpdateSchema>;
export type CampaignListQuery = z.infer<typeof CampaignListQuerySchema>;
export type CampaignResponse = z.infer<typeof CampaignResponseSchema>;
export type CampaignListResponse = z.infer<typeof CampaignListResponseSchema>;
export type CampaignProfitabilityCheck = z.infer<
	typeof CampaignProfitabilityCheckSchema
>;
export type CampaignProfitabilityResponse = z.infer<
	typeof CampaignProfitabilityResponseSchema
>;
export type CampaignStats = z.infer<typeof CampaignStatsSchema>;
export type CampaignGenerateCodes = z.infer<typeof CampaignGenerateCodesSchema>;
export type CampaignGenerateCodesResponse = z.infer<
	typeof CampaignGenerateCodesResponseSchema
>;
export type CampaignExportCodesResponse = z.infer<
	typeof CampaignExportCodesResponseSchema
>;

export const CampaignLtvAnalysisResponseSchema = z
	.object({
		campaignId: z.string(),
		cohortSize: z.number().int().nonnegative(),
		totalCohortLTV: z.number().nonnegative(),
		totalAttributedRevenue: z.number().nonnegative(),
		averageLTV: z.number().nonnegative(),
		averageAttributedRevenue: z.number().nonnegative(),
	})
	.openapi("CampaignLtvAnalysisResponse");

export type CampaignLtvAnalysisResponse = z.infer<
	typeof CampaignLtvAnalysisResponseSchema
>;
