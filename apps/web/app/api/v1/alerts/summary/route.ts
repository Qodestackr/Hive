import { createWorkspaceRoute } from "@/lib/api/create-api-route";
import { PromoProfitAlertSummarySchema } from "@repo/schema";
import { profitAlertService } from "@repo/services";

/**
 * GET /api/v1/alerts/summary
 * Get organization-wide alert summary for dashboard
 */
export const GET = createWorkspaceRoute({
    outputSchema: PromoProfitAlertSummarySchema,

    handler: async (_, { workspace }) => {
        return await profitAlertService.getAlertSummary(workspace.id);
    },

    options: {
        operationName: "getAlertSummary",
        requiredPermissions: ["campaigns.view"],
        cacheResponse: true,
        cacheTTL: 60, // Cache for 1 minute
        errorContext: {
            feature: "profit-alerts",
            action: "get-summary",
        },
    },
});
