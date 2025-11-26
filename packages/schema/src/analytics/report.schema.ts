import { z } from "zod";
import { ID } from "../shared/base.schema.js";

// Campaign Performance Report
export const CampaignPerformanceItemSchema = z
    .object({
        campaignId: ID,
        campaignName: z.string(),
        sent: z.number().int().nonnegative(),
        delivered: z.number().int().nonnegative(),
        opened: z.number().int().nonnegative(),
        clicked: z.number().int().nonnegative(),
        capturesCount: z.number().int().nonnegative(),
        conversions: z.number().int().nonnegative(),
        revenue: z.number().nonnegative(),
        discountCost: z.number().nonnegative(),
        totalCOGS: z.number().nonnegative(),
        actualProfit: z.number(),
        deliveryRate: z.number(),
        openRate: z.number(),
        clickRate: z.number(),
        conversionRate: z.number(),
        roi: z.number(),
    })
    .openapi("CampaignPerformanceItem");

export const CampaignReportSchema = z
    .object({
        periodStart: z.string().datetime(),
        periodEnd: z.string().datetime(),
        totalCampaigns: z.number().int().nonnegative(),
        totalCaptures: z.number().int().nonnegative(),
        totalRevenue: z.number().nonnegative(),
        totalProfit: z.number(),
        averageROI: z.number(),
        topCampaigns: z.array(CampaignPerformanceItemSchema).max(10),
        profitTrend: z.array(
            z.object({
                date: z.string().datetime(),
                profit: z.number(),
                revenue: z.number().nonnegative(),
                capturesCount: z.number().int().nonnegative(),
            }),
        ),
    })
    .openapi("CampaignReport");

// Product Performance Report
export const ProductPerformanceItemSchema = z
    .object({
        productId: ID,
        productName: z.string(),
        currentStock: z.number().int().nonnegative(),
        currentFIFOCost: z.number().nonnegative(),
        totalSold: z.number().int().nonnegative(),
        totalRevenue: z.number().nonnegative(),
        totalCOGS: z.number().nonnegative(),
        totalProfit: z.number(),
        avgProfitMargin: z.number(),
        turnoverRate: z.number(),
    })
    .openapi("ProductPerformanceItem");

export const ProductReportSchema = z
    .object({
        periodStart: z.string().datetime(),
        periodEnd: z.string().datetime(),
        totalProducts: z.number().int().nonnegative(),
        totalRevenue: z.number().nonnegative(),
        totalProfit: z.number(),
        averageProfitMargin: z.number(),
        topProducts: z.array(ProductPerformanceItemSchema).max(10),
        lowStockProducts: z.array(
            z.object({
                productId: ID,
                productName: z.string(),
                currentStock: z.number().int().nonnegative(),
                reorderLevel: z.number().int().nonnegative().optional(),
            }),
        ),
    })
    .openapi("ProductReport");

// Dashboard Metrics (Overall)
export const DashboardMetricsSchema = z
    .object({
        // Period
        periodStart: z.string().datetime(),
        periodEnd: z.string().datetime(),

        // Campaign metrics
        activeCampaigns: z.number().int().nonnegative(),
        totalCaptures: z.number().int().nonnegative(),
        totalCampaignRevenue: z.number().nonnegative(),
        totalCampaignProfit: z.number(),

        // Product metrics
        totalProducts: z.number().int().nonnegative(),
        lowStockCount: z.number().int().nonnegative(),
        totalInventoryValue: z.number().nonnegative(),

        // Financial metrics
        totalRevenue: z.number().nonnegative(),
        totalProfit: z.number(),
        profitMargin: z.number(),
        averageOrderValue: z.number().nonnegative(),

        // Customer metrics
        totalCustomers: z.number().int().nonnegative(),
        newCustomers: z.number().int().nonnegative(),
        repeatCustomers: z.number().int().nonnegative(),
        customerRetentionRate: z.number(),

        // Trends
        revenueTrend: z.array(
            z.object({
                date: z.string().datetime(),
                revenue: z.number().nonnegative(),
            }),
        ),
        profitTrend: z.array(
            z.object({
                date: z.string().datetime(),
                profit: z.number(),
            }),
        ),
    })
    .openapi("DashboardMetrics");

// Report Request Schemas
export const ReportPeriodSchema = z
    .object({
        periodStart: z.string().datetime(),
        periodEnd: z.string().datetime(),
    })
    .refine((data) => new Date(data.periodEnd) > new Date(data.periodStart), {
        message: "End date must be after start date",
        path: ["periodEnd"],
    })
    .openapi("ReportPeriod");

export const CampaignReportRequestSchema = ReportPeriodSchema.extend({
    campaignIds: z.array(ID).optional().openapi({
        description: "Filter by specific campaign IDs",
    }),
    includeInactive: z.boolean().default(false),
}).openapi("CampaignReportRequest");

export const ProductReportRequestSchema = ReportPeriodSchema.extend({
    productIds: z.array(ID).optional().openapi({
        description: "Filter by specific product IDs",
    }),
    categoryIds: z.array(ID).optional(),
}).openapi("ProductReportRequest");

// Type exports
export type CampaignPerformanceItem = z.infer<typeof CampaignPerformanceItemSchema>;
export type CampaignReport = z.infer<typeof CampaignReportSchema>;
export type ProductPerformanceItem = z.infer<typeof ProductPerformanceItemSchema>;
export type ProductReport = z.infer<typeof ProductReportSchema>;
export type DashboardMetrics = z.infer<typeof DashboardMetricsSchema>;
export type ReportPeriod = z.infer<typeof ReportPeriodSchema>;
export type CampaignReportRequest = z.infer<typeof CampaignReportRequestSchema>;
export type ProductReportRequest = z.infer<typeof ProductReportRequestSchema>;
