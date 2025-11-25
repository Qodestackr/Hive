import { createWorkspaceRoute } from "@/lib/api/create-api-route";
import { CampaignLtvAnalysisResponseSchema } from "@repo/schema";
import { campaignService } from "@repo/services/src/campaign.service";

/**
 * GET /api/v1/campaigns/:id/ltv-analysis
 * 
 * Get campaign LTV analysis (Cohort Value)
 * THE PROOF: Shows the long-term value of customers acquired by this campaign.
 */
export const GET = createWorkspaceRoute({
    // No inputSchema - campaignId comes from params
    outputSchema: CampaignLtvAnalysisResponseSchema,

    handler: async (_, { workspace, params }) => {
        const campaignId = params.id;
        return await campaignService.getCampaignLtvAnalysis(campaignId!, workspace.id);
    },

    options: {
        operationName: "getCampaignLtvAnalysis",
        requiredPermissions: ["campaigns.view"],
        errorContext: {
            feature: "profit-intelligence",
            action: "analyze-ltv",
        },
    },
});
