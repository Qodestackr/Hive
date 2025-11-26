import {
	CampaignGenerateCodesResponseSchema,
	CampaignGenerateCodesSchema,
} from "@repo/schema";
import { campaignStatsService } from "@repo/services";
import { createWorkspaceRoute } from "@/lib/api/create-api-route";

export const POST = createWorkspaceRoute({
	inputSchema: CampaignGenerateCodesSchema,
	outputSchema: CampaignGenerateCodesResponseSchema,

	handler: async (data, { workspace, params }) => {
		const { count } = data as { count: number };
		return await campaignStatsService.generateCodes(
			params.id!,
			count,
			workspace.id,
		);
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
