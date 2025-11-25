import { z } from "zod";
import { ID, Timestamps } from "../shared/base.schema.js";
import { AlertType, AlertSeverity } from "../shared/enums.schema.js";

// ============================================================================
// PROFIT ALERT SCHEMAS (Real-time profit monitoring)
// ============================================================================

export const PromoProfitAlertSchema = z.object({
    id: z.string(),
    organizationId: z.string(),
    campaignId: z.string(),
    productId: z.string().nullable(),
    alertType: AlertType,
    severity: AlertSeverity,
    message: z.string(),
    currentFIFOCost: z.number().nonnegative().nullable(),
    discountPercent: z.number().nullable(),
    redemptionsCount: z.number().int().nonnegative().nullable(),
    totalLoss: z.number().nullable(),
    estimatedLossPerRedemption: z.number().nullable(),
    isResolved: z.boolean().default(false),
    actionTaken: z.string().nullable(),
    resolvedAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
}).openapi('PromoProfitAlert');

export const PromoProfitAlertCreateSchema = z.object({
    campaignId: z.string().min(1, "Campaign ID is required"),
    productId: z.string().optional(),
    alertType: AlertType,
    severity: AlertSeverity,
    message: z.string().min(1, "Alert message is required").openapi({
        example: 'Campaign losing KES 400 per redemption'
    }),
    currentFIFOCost: z.number().nonnegative().optional(),
    discountPercent: z.number().optional(),
    redemptionsCount: z.number().int().nonnegative().optional(),
    totalLoss: z.number().optional(),
    estimatedLossPerRedemption: z.number().optional(),
}).openapi('PromoProfitAlertCreate');

export const PromoProfitAlertResolveSchema = z.object({
    actionTaken: z.string().min(1, "Action taken is required").openapi({
        example: 'Paused campaign and adjusted discount to 10%'
    }),
}).openapi('PromoProfitAlertResolve');

export const PromoProfitAlertListQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    campaignId: z.string().optional(),
    productId: z.string().optional(),
    alertType: AlertType.optional(),
    severity: AlertSeverity.optional(),
    isResolved: z.coerce.boolean().optional(),
    sortBy: z.enum(["createdAt", "severity", "totalLoss"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
}).openapi('PromoProfitAlertListQuery');

export const PromoProfitAlertResponseSchema = PromoProfitAlertSchema.openapi('PromoProfitAlertResponse');

export const PromoProfitAlertListResponseSchema = z.object({
    data: z.array(PromoProfitAlertResponseSchema),
    pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
    }),
}).openapi('PromoProfitAlertListResponse');

export const PromoProfitAlertSummarySchema = z.object({
    totalAlerts: z.number().int().nonnegative(),
    unresolvedAlerts: z.number().int().nonnegative(),
    criticalAlerts: z.number().int().nonnegative(),
    totalEstimatedLoss: z.number(),
    alertsByType: z.record(z.string(), z.number().int().nonnegative()),
    alertsBySeverity: z.record(z.string(), z.number().int().nonnegative()),
    recentAlerts: z.array(PromoProfitAlertResponseSchema).max(5),
}).openapi('PromoProfitAlertSummary');

export type PromoProfitAlert = z.infer<typeof PromoProfitAlertSchema>;
export type PromoProfitAlertCreate = z.infer<typeof PromoProfitAlertCreateSchema>;
export type PromoProfitAlertResolve = z.infer<typeof PromoProfitAlertResolveSchema>;
export type PromoProfitAlertListQuery = z.infer<typeof PromoProfitAlertListQuerySchema>;
export type PromoProfitAlertResponse = z.infer<typeof PromoProfitAlertResponseSchema>;
export type PromoProfitAlertListResponse = z.infer<typeof PromoProfitAlertListResponseSchema>;
export type PromoProfitAlertSummary = z.infer<typeof PromoProfitAlertSummarySchema>;
