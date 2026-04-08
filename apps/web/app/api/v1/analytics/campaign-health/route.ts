import { CampaignHealthResponseSchema } from "@repo/schema";
import { analyticsService } from "@repo/analytics/services";
import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";

/**
 * GET /api/v1/analytics/campaign-health
 *
 * Business Question: "Is this campaign making or losing money RIGHT NOW?"
 *
 * Returns:
 * - Active campaigns with profit health status
 * - Summary: total campaigns, losing money count, total profit
 *
 * Prescriptive intelligence for outcome-based pricing.
 */
export const GET = createWorkspaceRouteEffect({
    outputSchema: CampaignHealthResponseSchema,

    handler: () => analyticsService.getCampaignHealthEffect(),

    options: {
        operationName: "getCampaignHealth",
        requiredPermissions: ["analytics.view"],
        errorContext: {
            feature: "analytics",
            action: "campaign-health",
        },
    },
});
