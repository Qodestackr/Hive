import { createWorkspaceRoute } from "@/lib/api/create-api-route";
import { CampaignResponseSchema } from "@repo/schema";
import { campaignService } from "@repo/services/src/campaign.service";

/**
 * GET /api/v1/campaigns/:id
 * 
 * Get campaign by ID with profit totals
 * THE VALIDATION: Shows aggregated results from all promo code redemptions
 * 
 * This is where you KNOW the FIFO engine works:
 * - totalCOGS: Sum of FIFO costs from all redemptions
 * - actualProfit: revenue - discountCost - totalCOGS
 * - isLosingMoney: TRUE if actualProfit < 0
 */
export const GET = createWorkspaceRoute({
    // No inputSchema - campaignId comes from params
    outputSchema: CampaignResponseSchema,

    handler: async (_, { workspace, params }) => {
        const campaignId = params.id;
        return await campaignService.getCampaignById(campaignId!, workspace.id);
    },

    options: {
        operationName: "getCampaignById",
        requiredPermissions: ["campaigns.view"],
        errorContext: {
            feature: "campaigns",
            action: "get-by-id",
        },
    },
});
