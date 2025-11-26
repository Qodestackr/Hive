import { createWorkspaceRoute } from "@/lib/api/create-api-route";
import { AutoPauseActionResponseSchema } from "@repo/schema";
import { profitAlertService } from "@repo/services";

/**
 * Manually trigger auto-pause check
 * 
 * This allows:
 * - Manual execution from dashboard
 * - AI agent automation
 * - Testing the alert system
 */
export const POST = createWorkspaceRoute({
    outputSchema: AutoPauseActionResponseSchema,

    handler: async (_, { workspace, params }) => {
        return await profitAlertService.autoPauseCampaign(
            params.id!,
            workspace.id
        );
    },

    options: {
        operationName: "autoPauseCampaign",
        requiredPermissions: ["campaigns.update"],
        errorContext: {
            feature: "profit-alerts",
            action: "auto-pause",
        },
    },
});
