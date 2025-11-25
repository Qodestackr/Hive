import { createWorkspaceRoute } from "@/lib/api/create-api-route";
import {
    BulkProfitCheckRequestSchema,
    BulkProfitCheckResponseSchema,
} from "@repo/schema";
import { profitAlertService } from "@repo/services";

/**
 * POST /api/v1/campaigns/bulk-check
 * Check multiple campaigns at once
 * 
 * Useful for:
 * - Dashboard "Check All Active Campaigns" button
 * - Batch AI agent analysis
 * - Scheduled execution (if added later)
 */
export const POST = createWorkspaceRoute({
    inputSchema: BulkProfitCheckRequestSchema,
    outputSchema: BulkProfitCheckResponseSchema,

    handler: async (data, { workspace }) => {
        return await profitAlertService.bulkProfitCheck(data, workspace.id);
    },

    options: {
        operationName: "bulkProfitCheck",
        requiredPermissions: ["campaigns.view"],
        errorContext: {
            feature: "profit-alerts",
            action: "bulk-check",
        },
    },
});
