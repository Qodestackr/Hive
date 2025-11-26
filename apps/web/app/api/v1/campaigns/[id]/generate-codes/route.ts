import {
	type CampaignGenerateCodes,
	CampaignGenerateCodesResponseSchema,
	CampaignGenerateCodesSchema,
} from "@repo/schema";
import { campaignService } from "@repo/services";
import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";

export const POST = createWorkspaceRouteEffect({
	inputSchema: CampaignGenerateCodesSchema,
	outputSchema: CampaignGenerateCodesResponseSchema,

	handler: (data: CampaignGenerateCodes, { params }) =>
		campaignService.generateCodesEffect(params.id!, data.count),

	options: {
		operationName: "generateCampaignCodes",
		requiredPermissions: ["campaigns.update"],
		errorContext: {
			feature: "campaign-management",
			action: "generate-codes",
		},
	},
});
