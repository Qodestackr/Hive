import { createWorkspaceRoute } from "@/lib/api/create-api-route";
import {
    CampaignCreateSchema,
    CampaignResponseSchema,
    CampaignListQuerySchema,
    CampaignListResponseSchema,
} from "@repo/schema";
import { campaignStatsService } from "@repo/services";

/**
 * POST /api/v1/campaigns
 * Create campaign
 */
export const POST = createWorkspaceRoute({
    inputSchema: CampaignCreateSchema,
    outputSchema: CampaignResponseSchema,

    handler: async (data, { workspace }) => {
        return await campaignStatsService.createCampaign(data, workspace.id);
    },

    options: {
        operationName: "createCampaign",
        requiredPermissions: ["campaigns.create"],
        errorContext: {
            feature: "campaign-management",
            action: "create",
        },
    },
});

/**
 * GET /api/v1/campaigns
 * List campaigns with filters
 */
export const GET = createWorkspaceRoute({
    inputSchema: CampaignListQuerySchema,
    outputSchema: CampaignListResponseSchema,
    inputType: "query",

    handler: async (query, { workspace }) => {
        return await campaignStatsService.listCampaigns(query, workspace.id);
    },

    options: {
        operationName: "listCampaigns",
        requiredPermissions: ["campaigns.read"],
        errorContext: {
            feature: "campaign-management",
            action: "list",
        },
    },
});
