import { createWorkspaceRoute } from "@/lib/api/create-api-route";
import { CampaignStatsSchema } from "@repo/schema";
import { campaignStatsService } from "@repo/services";
import { z } from "@repo/utils";

/**
 * GET `/api/v1/campaigns/:id/stats`
 * 
 * Get campaign stats from immutable promoCode ledger
 * 
 * THE VALIDATION: Real metrics from actual redemptions
 */
export const GET = createWorkspaceRoute({
    inputSchema: z.void(),
    outputSchema: CampaignStatsSchema,

    handler: async (_, { workspace, params }) => {
        return await campaignStatsService.getCampaignStats(params.id!, workspace.id);
    },

    options: {
        operationName: "getCampaignStats",
        requiredPermissions: ["campaigns.read"],
        errorContext: {
            feature: "campaign-management",
            action: "stats",
        },
    },
});
