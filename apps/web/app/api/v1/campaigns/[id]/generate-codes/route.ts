import { createWorkspaceRoute } from "@/lib/api/create-api-route";
import {
    CampaignGenerateCodesSchema,
    CampaignGenerateCodesResponseSchema
} from "@repo/schema";
import { campaignStatsService } from "@repo/services";

/**
 * POST /api/v1/campaigns/:id/generate-codes
 * Generate bulk promo codes
 */
export const POST = createWorkspaceRoute({
    inputSchema: CampaignGenerateCodesSchema,
    outputSchema: CampaignGenerateCodesResponseSchema,

    handler: async (data, { workspace, params }) => {
        return await campaignStatsService.generateCodes(params.id!, data.count, workspace.id);
    },

    options: {
        operationName: "generateCampaignCodes",
        requiredPermissions: ["campaigns.update"],
        errorContext: {
            feature: "campaign-management",
            action: "generate-codes",
        },
    },
});
