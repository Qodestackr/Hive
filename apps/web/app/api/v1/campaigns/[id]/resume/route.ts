import { createWorkspaceRoute } from "@/lib/api/create-api-route";
import { CampaignResponseSchema } from "@repo/schema";
import { campaignStatsService } from "@repo/services";
import { z } from "zod";

/**
 * POST /api/v1/campaigns/:id/resume
 * Resume campaign
 */
export const POST = createWorkspaceRoute({
    inputSchema: z.void(),
    outputSchema: CampaignResponseSchema,

    handler: async (_, { workspace, params }) => {
        return await campaignStatsService.resumeCampaign(params.id!, workspace.id);
    },

    options: {
        operationName: "resumeCampaign",
        requiredPermissions: ["campaigns.update"],
        errorContext: {
            feature: "campaign-management",
            action: "resume",
        },
    },
});
