import { createWorkspaceRoute } from "@/lib/api/create-api-route";
import {
    PromoProfitAlertResponseSchema,
    PromoProfitAlertResolveSchema,
} from "@repo/schema";
import { profitAlertService } from "@repo/services";
import { createError } from "@repo/utils";

export const GET = createWorkspaceRoute({
    outputSchema: PromoProfitAlertResponseSchema,

    handler: async (_, { workspace, params }) => {
        // List alerts with filter for specific alert ID
        const result = await profitAlertService.listAlerts(
            {
                page: 1,
                limit: 1,
                campaignId: params.id,
            },
            workspace.id
        );

        const alert = result.data.find(a => a.id === params.alertId);

        if (!alert) {
            throw createError.notFound("Alert", {
                alertId: params.alertId,
                campaignId: params.id,
            });
        }

        return alert;
    },

    options: {
        operationName: "getProfitAlert",
        requiredPermissions: ["campaigns.view"],
        errorContext: {
            feature: "profit-alerts",
            action: "get-alert",
        },
    },
});

/**
 * PATCH /api/v1/campaigns/:id/alerts/:alertId
 * Resolve an alert
 */
export const PATCH = createWorkspaceRoute({
    inputSchema: PromoProfitAlertResolveSchema,
    outputSchema: PromoProfitAlertResponseSchema,

    handler: async (data, { workspace, params }) => {
        return await profitAlertService.resolveAlert(
            params.alertId!,
            data,
            workspace.id
        );
    },

    options: {
        operationName: "resolveProfitAlert",
        requiredPermissions: ["campaigns.update"],
        errorContext: {
            feature: "profit-alerts",
            action: "resolve-alert",
        },
    },
});
