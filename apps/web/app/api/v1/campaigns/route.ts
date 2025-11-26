import {
	CampaignCreateSchema,
	CampaignListQuerySchema,
	CampaignListResponseSchema,
	CampaignResponseSchema,
} from "@repo/schema";
import { campaignService } from "@repo/services";
import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";

export const POST = createWorkspaceRouteEffect({
	inputSchema: CampaignCreateSchema,
	outputSchema: CampaignResponseSchema,

	handler: (data) => campaignService.createCampaignEffect(data),

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
export const GET = createWorkspaceRouteEffect({
	inputSchema: CampaignListQuerySchema,
	outputSchema: CampaignListResponseSchema,
	handler: (query) => campaignService.listCampaignsEffect(query),

	options: {
		operationName: "listCampaigns",
		requiredPermissions: ["campaigns.read"],
		errorContext: {
			feature: "campaign-management",
			action: "list",
		},
	},
});
