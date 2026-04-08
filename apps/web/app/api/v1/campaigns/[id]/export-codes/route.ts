import { CampaignExportCodesResponseSchema } from "@repo/schema";
import { campaignService } from "@repo/services";
import { z } from "@repo/schema";
import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";

export const POST = createWorkspaceRouteEffect({
	inputSchema: z.void(),
	outputSchema: CampaignExportCodesResponseSchema,

	handler: (_, { params }) => campaignService.exportCodesEffect(params.id!),

	options: {
		operationName: "exportCampaignCodes",
		requiredPermissions: ["campaigns.read"],
		errorContext: {
			feature: "campaign-management",
			action: "export-codes",
		},
	},
});
