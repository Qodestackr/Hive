import { SlowMoversResponseSchema } from "@repo/schema";
import { analyticsService } from "@repo/analytics/services";
import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";

/**
 * GET /api/v1/analytics/slow-movers
 *
 * Business Question: "What should I promote to clear stock AND make money?"
 *
 * Returns products with:
 * - Low velocity (<50 units/30d OR >100 stock)
 * - Margin % and recommendation (PROMOTE_NOW, MODERATE_PROMO, AVOID, MOVING_WELL)
 */
export const GET = createWorkspaceRouteEffect({
    outputSchema: SlowMoversResponseSchema,

    handler: () => analyticsService.getSlowMoversEffect(),

    options: {
        operationName: "getSlowMovers",
        requiredPermissions: ["analytics.view"],
        errorContext: {
            feature: "analytics",
            action: "slow-movers",
        },
    },
});
