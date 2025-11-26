import {
	CampaignCreateSchema,
	CampaignListQuerySchema,
	CampaignListResponseSchema,
	CampaignResponseSchema,
} from "@repo/schema";
import { campaignStatsService } from "@repo/services";
import { createWorkspaceRoute } from "@/lib/api/create-api-route";

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

// List campaigns with filters
export const GET = createWorkspaceRoute({
	inputSchema: CampaignListQuerySchema,
	outputSchema: CampaignListResponseSchema,
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
