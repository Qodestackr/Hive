import { z } from "zod";

/**
 * Analytics Zod Schemas
 *
 * Single source of truth for analytics API validation.
 * Auto-generates TypeScript types and OpenAPI specs.
 *
 * Pattern: Zod schema → TypeScript type → OpenAPI spec
 */

// ============================================================================
// Campaign Health Schemas
// ============================================================================

export const CampaignHealthMetricsSchema = z.object({
    id: z.string(),
    name: z.string(),
    status: z.string(),
    redemptions: z.number().int(),
    totalProfit: z.number(),
    avgProfitPerRedemption: z.number(),
    profitMarginPct: z.number(),
    healthStatus: z.enum(["🚨 LOSING_MONEY", "⚠️ LOW_MARGIN", "✅ HEALTHY"]),
});

export const CampaignHealthResponseSchema = z.object({
    campaigns: z.array(CampaignHealthMetricsSchema),
    summary: z.object({
        totalCampaigns: z.number().int(),
        losingMoney: z.number().int(),
        totalProfit: z.number(),
    }),
});

export type CampaignHealthResponse = z.infer<
    typeof CampaignHealthResponseSchema
>;

// ============================================================================
// Slow Movers Schemas
// ============================================================================

export const SlowMoverProductSchema = z.object({
    id: z.string(),
    name: z.string(),
    category: z.string().nullable(),
    currentStock: z.number().int(),
    unitsSold30d: z.number().int(),
    marginPct: z.number(),
    recommendation: z.enum([
        "PROMOTE_NOW",
        "MODERATE_PROMO",
        "AVOID",
        "MOVING_WELL",
    ]),
});

export const SlowMoversResponseSchema = z.object({
    products: z.array(SlowMoverProductSchema),
});

export type SlowMoversResponse = z.infer<typeof SlowMoversResponseSchema>;

// ============================================================================
// Customer Capture ROI Schemas
// ============================================================================

export const CampaignCaptureROISchema = z.object({
    campaignId: z.string(),
    captureCampaign: z.string(),
    customersCaptured: z.number().int(),
    avgLTV: z.number(),
    totalProfitGenerated: z.number(),
    totalRedemptions: z.number().int(),
    captureFeeROI: z.number(),
});

export const CaptureROIResponseSchema = z.object({
    campaigns: z.array(CampaignCaptureROISchema),
});

export type CaptureROIResponse = z.infer<typeof CaptureROIResponseSchema>;

// ============================================================================
// Margin Erosion Schemas
// ============================================================================

export const MarginErosionAlertSchema = z.object({
    id: z.string(),
    name: z.string(),
    redemptionDate: z.string(),
    redemptions: z.number().int(),
    marginPct: z.number(),
    prevMargin: z.number(),
    marginDrop: z.number(),
    avgProfit: z.number(),
});

export const MarginErosionResponseSchema = z.object({
    alerts: z.array(MarginErosionAlertSchema),
});

export type MarginErosionResponse = z.infer<
    typeof MarginErosionResponseSchema
>;

// ============================================================================
// Category Performance Schemas
// ============================================================================

export const CategoryPerformanceSchema = z.object({
    category: z.string(),
    campaignsRun: z.number().int(),
    profitableCampaigns: z.number().int(),
    successRatePct: z.number(),
    avgProfitPerRedemption: z.number(),
    totalCategoryProfit: z.number(),
});

export const CategoryPerformanceResponseSchema = z.object({
    categories: z.array(CategoryPerformanceSchema),
});

export type CategoryPerformanceResponse = z.infer<
    typeof CategoryPerformanceResponseSchema
>;

// ============================================================================
// Cost Trends Schemas
// ============================================================================

export const CostTrendProductSchema = z.object({
    id: z.string(),
    name: z.string(),
    category: z.string().nullable(),
    currentCost: z.number(),
    avgCost90d: z.number(),
    avgCost30d: z.number(),
    costIncreasePct: z.number(),
    currentStockQuantity: z.number().int(),
    leadTimeDays: z.number().int(),
    recommendation: z.enum(["BUY_NOW", "LOW_STOCK", "PRICE_SPIKE", "STABLE"]),
});

export const CostTrendsResponseSchema = z.object({
    products: z.array(CostTrendProductSchema),
});

export type CostTrendsResponse = z.infer<typeof CostTrendsResponseSchema>;

// ============================================================================
// Compliance Summary Schemas
// ============================================================================

export const ComplianceLogSummarySchema = z.object({
    month: z.string(),
    eventType: z.string(),
    eventCount: z.number().int(),
    uniqueCustomers: z.number().int(),
});

export const ComplianceSummaryResponseSchema = z.object({
    logs: z.array(ComplianceLogSummarySchema),
});

export type ComplianceSummaryResponse = z.infer<
    typeof ComplianceSummaryResponseSchema
>;
