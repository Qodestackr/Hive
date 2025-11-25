import { createWorkspaceRoute } from "@/lib/api/create-api-route";
import {
    AlertSettingsUpdateSchema,
    AlertSettingsResponseSchema,
} from "@repo/schema";
import { profitAlertService } from "@repo/services";

/**
 * GET /api/v1/campaigns/:id/settings/alerts
 * Get alert settings for campaign
 */
export const GET = createWorkspaceRoute({
    outputSchema: AlertSettingsResponseSchema,

    handler: async (_, { workspace, params }) => {
        return await profitAlertService.getAlertSettings(
            params.id!,
            workspace.id
        );
    },

    options: {
        operationName: "getAlertSettings",
        requiredPermissions: ["campaigns.view"],
        errorContext: {
            feature: "profit-alerts",
            action: "get-settings",
        },
    },
});

/**
 * PUT /api/v1/campaigns/:id/settings/alerts
 * Update alert settings for campaign
 */
export const PUT = createWorkspaceRoute({
    inputSchema: AlertSettingsUpdateSchema,
    outputSchema: AlertSettingsResponseSchema,

    handler: async (data, { workspace, params }) => {
        return await profitAlertService.updateAlertSettings(
            params.id!,
            data,
            workspace.id
        );
    },

    options: {
        operationName: "updateAlertSettings",
        requiredPermissions: ["campaigns.update"],
        errorContext: {
            feature: "profit-alerts",
            action: "update-settings",
        },
    },
});
