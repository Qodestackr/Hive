import { createWorkspaceRoute } from "@/lib/api/create-api-route";
import { CampaignResponseSchema } from "@repo/schema";
import { campaignStatsService } from "@repo/services";
import { z } from "zod";

/**
 * POST /api/v1/campaigns/:id/pause
 * Pause campaign
 */
export const POST = createWorkspaceRoute({
    inputSchema: z.void(),
    outputSchema: CampaignResponseSchema,

    handler: async (_, { workspace, params }) => {
        return await campaignStatsService.pauseCampaign(params.id!, workspace.id);
    },

    options: {
        operationName: "pauseCampaign",
        requiredPermissions: ["campaigns.update"],
        errorContext: {
            feature: "campaign-management",
            action: "pause",
        },
    },
});
