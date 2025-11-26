import { CampaignExportCodesResponseSchema } from "@repo/schema";
import { campaignStatsService } from "@repo/services";
import { z } from "@repo/utils";
import { createWorkspaceRoute } from "@/lib/api/create-api-route";

export const POST = createWorkspaceRoute({
	inputSchema: z.void(),
	outputSchema: CampaignExportCodesResponseSchema,

	handler: async (_, { workspace, params }) => {
		return await campaignStatsService.exportCodes(params.id!, workspace.id);
	},

	options: {
		operationName: "exportCampaignCodes",
		requiredPermissions: ["campaigns.read"],
		errorContext: {
			feature: "campaign-management",
			action: "export-codes",
		},
	},
});
