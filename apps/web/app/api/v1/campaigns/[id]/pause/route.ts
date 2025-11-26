import { CampaignResponseSchema } from "@repo/schema";
import { campaignStatsService } from "@repo/services";
import { z } from "@repo/utils";
import { createWorkspaceRoute } from "@/lib/api/create-api-route";

export const POST = createWorkspaceRoute({
	inputSchema: z.void(),
	outputSchema: CampaignResponseSchema,

	handler: async (_, { workspace, params }) => {
		return await campaignStatsService.pauseCampaign(params.id!, workspace.id);
	},

	options: {
		operationName: "pauseCampaign",
		requiredPermissions: ["campaigns.update"],
		errorContext: {
			feature: "campaign-management",
			action: "pause",
		},
	},
});
