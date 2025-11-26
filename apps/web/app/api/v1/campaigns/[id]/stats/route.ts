import { CampaignStatsSchema } from "@repo/schema";
import { campaignStatsService } from "@repo/services";
import { z } from "@repo/utils";
import { createWorkspaceRoute } from "@/lib/api/create-api-route";

export const GET = createWorkspaceRoute({
	inputSchema: z.void(),
	outputSchema: CampaignStatsSchema,

	handler: async (_, { workspace, params }) => {
		return await campaignStatsService.getCampaignStats(
			params.id!,
			workspace.id,
		);
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
