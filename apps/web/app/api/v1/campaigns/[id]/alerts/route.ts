import { createWorkspaceRoute } from "@/lib/api/create-api-route";
import {
    PromoProfitAlertCreateSchema,
    PromoProfitAlertResponseSchema,
    PromoProfitAlertListQuerySchema,
    PromoProfitAlertListResponseSchema,
} from "@repo/schema";
import { profitAlertService } from "@repo/services";

/**
 * GET /api/v1/campaigns/:id/alerts
 * List alerts for a specific campaign
 */
export const GET = createWorkspaceRoute({
    outputSchema: PromoProfitAlertListResponseSchema,

    handler: async (_, { workspace, params, searchParams }) => {
        const query = PromoProfitAlertListQuerySchema.parse({
            ...searchParams,
            campaignId: params.id,
        });

        return await profitAlertService.listAlerts(query, workspace.id);
    },

    options: {
        operationName: "listCampaignAlerts",
        requiredPermissions: ["campaigns.view"],
        errorContext: {
            feature: "profit-alerts",
            action: "list-alerts",
        },
    },
});

/**
 * POST /api/v1/campaigns/:id/alerts
 * Manually create an alert (for testing or admin)
 */
export const POST = createWorkspaceRoute({
    inputSchema: PromoProfitAlertCreateSchema,
    outputSchema: PromoProfitAlertResponseSchema,

    handler: async (data, { workspace, params }) => {
        // Ensure campaignId matches route param
        const alertData = {
            ...data,
            campaignId: params.id!,
        };

        return await profitAlertService.createAlert(alertData, workspace.id);
    },

    options: {
        operationName: "createProfitAlert",
        requiredPermissions: ["campaigns.update"],
        errorContext: {
            feature: "profit-alerts",
            action: "create-alert",
        },
    },
});
