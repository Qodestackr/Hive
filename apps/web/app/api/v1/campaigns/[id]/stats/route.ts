import { CampaignStatsSchema } from "@repo/schema";
import { campaignService } from "@repo/services";
import { z } from "@repo/schema";
import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";

export const GET = createWorkspaceRouteEffect({
	inputSchema: z.void(),
	outputSchema: CampaignStatsSchema,

	handler: (_, { params }) => campaignService.getCampaignStatsEffect(params.id!),

	options: {
		operationName: "getCampaignStats",
		requiredPermissions: ["campaigns.read"],
		errorContext: {
			feature: "campaign-management",
			action: "stats",
		},
	},
});
