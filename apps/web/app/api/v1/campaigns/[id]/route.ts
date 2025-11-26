import { createWorkspaceRoute } from "@/lib/api/create-api-route";
import { CampaignResponseSchema } from "@repo/schema";
import { campaignService } from "@repo/services/src/campaign.service";
import { z } from "@repo/utils";

/**
 * GET `/api/v1/campaigns/:id`
 * 
 * Get campaign by ID with profit totals
 * THE VALIDATION: Shows aggregated results from all promo code redemptions
 * 
 * This is where we know the FIFO engine works:
 * - totalCOGS: Sum of FIFO costs from all redemptions
 * - actualProfit: revenue - discountCost - totalCOGS
 * - isLosingMoney: TRUE if actualProfit < 0
 */
export const GET = createWorkspaceRoute({
    inputSchema: z.void(),
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
