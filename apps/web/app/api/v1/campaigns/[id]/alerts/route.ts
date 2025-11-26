import { createWorkspaceRoute } from "@/lib/api/create-api-route";
import {
    PromoProfitAlertCreateSchema,
    PromoProfitAlertResponseSchema,
    PromoProfitAlertListQuerySchema,
    PromoProfitAlertListResponseSchema,
} from "@repo/schema";
import { profitAlertService } from "@repo/services";

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
        return await profitAlertService.createAlert(
            {
                ...(data as Record<string, any>),
                campaignId: params.id!,
            },
            workspace.id
        );
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
