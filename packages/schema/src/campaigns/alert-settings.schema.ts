import { z } from "zod";
import { ID } from "../shared/base.schema.js";

// ============================================================================
// ALERT SETTINGS SCHEMAS
// ============================================================================

/**
 * Update alert settings for a campaign
 */
export const AlertSettingsUpdateSchema = z.object({
    autoPauseEnabled: z.boolean().optional().openapi({
        description: "Enable automatic campaign pause when profit margin drops below threshold",
        example: true,
    }),
    pauseThreshold: z.number().min(0).max(100).optional().openapi({
        description: "Profit margin percentage threshold for auto-pause (e.g., 10 = 10%)",
        example: 10.0,
    }),
    notificationsEnabled: z.boolean().optional().openapi({
        description: "Send alerts to distributor when threshold is breached",
        example: true,
    }),
    alertCheckInterval: z.number().int().min(60).max(3600).optional().openapi({
        description: "Seconds between profit checks (min: 60s, max: 1 hour)",
        example: 300,
    }),
}).openapi('AlertSettingsUpdate');

/**
 * Alert settings response
 */
export const AlertSettingsResponseSchema = z.object({
    campaignId: ID,
    autoPauseEnabled: z.boolean(),
    pauseThreshold: z.number(),
    notificationsEnabled: z.boolean(),
    alertCheckInterval: z.number().int(),
}).openapi('AlertSettingsResponse');

// ============================================================================
// PROFIT CHECK SCHEMAS
// ============================================================================

/**
 * Request schema for manual profit check
 */
export const ProfitCheckRequestSchema = z.object({
    createAlertIfBelowThreshold: z.boolean().default(false).openapi({
        description: "Automatically create alert if profit margin is below threshold",
        example: false,
    }),
}).openapi('ProfitCheckRequest');

/**
 * Profit check response
 */
export const ProfitCheckResponseSchema = z.object({
    campaignId: ID,
    currentProfitMargin: z.number().openapi({
        description: "Current profit margin percentage",
        example: 15.5,
    }),
    threshold: z.number().openapi({
        description: "Configured profit margin threshold",
        example: 10.0,
    }),
    isAboveThreshold: z.boolean().openapi({
        description: "Whether current margin is above threshold",
        example: true,
    }),
    totalRevenue: z.number().nonnegative(),
    totalCOGS: z.number().nonnegative(),
    actualProfit: z.number(),
    redemptionCount: z.number().int().nonnegative(),
    alertCreated: z.boolean().optional().openapi({
        description: "Whether an alert was created during this check",
        example: false,
    }),
    alertId: z.string().optional().openapi({
        description: "ID of alert created (if alertCreated is true)",
    }),
}).openapi('ProfitCheckResponse');

// ============================================================================
// BULK CHECK SCHEMAS
// ============================================================================

/**
 * Bulk profit check request
 */
export const BulkProfitCheckRequestSchema = z.object({
    campaignIds: z.array(ID).min(1).max(50).openapi({
        description: "Array of campaign IDs to check (max 50)",
        example: ["camp_123", "camp_456"],
    }),
    createAlertsIfBelowThreshold: z.boolean().default(false),
}).openapi('BulkProfitCheckRequest');

export const BulkProfitCheckResponseSchema = z.object({
    results: z.array(ProfitCheckResponseSchema),
    totalChecked: z.number().int().nonnegative(),
    belowThreshold: z.number().int().nonnegative(),
    alertsCreated: z.number().int().nonnegative(),
}).openapi('BulkProfitCheckResponse');

export const AutoPauseActionResponseSchema = z.object({
    campaignId: ID,
    wasPaused: z.boolean().openapi({
        description: "Whether the campaign was paused",
        example: true,
    }),
    reason: z.string().optional().openapi({
        description: "Reason for pause or no-pause",
        example: "Profit margin (8.5%) below threshold (10%)",
    }),
    profitCheck: ProfitCheckResponseSchema,
}).openapi('AutoPauseActionResponse');

export type AlertSettingsUpdate = z.infer<typeof AlertSettingsUpdateSchema>;
export type AlertSettingsResponse = z.infer<typeof AlertSettingsResponseSchema>;
export type ProfitCheckRequest = z.infer<typeof ProfitCheckRequestSchema>;
export type ProfitCheckResponse = z.infer<typeof ProfitCheckResponseSchema>;
export type BulkProfitCheckRequest = z.infer<typeof BulkProfitCheckRequestSchema>;
export type BulkProfitCheckResponse = z.infer<typeof BulkProfitCheckResponseSchema>;
export type AutoPauseActionResponse = z.infer<typeof AutoPauseActionResponseSchema>;