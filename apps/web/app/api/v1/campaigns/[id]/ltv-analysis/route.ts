import { CampaignLtvAnalysisResponseSchema } from "@repo/schema";
import { campaignService } from "@repo/services";
import { z } from "@repo/utils";
import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";

export const GET = createWorkspaceRouteEffect({
	inputSchema: z.void(),
	outputSchema: CampaignLtvAnalysisResponseSchema,

	handler: (_data, context) =>
		campaignService.getCampaignLtvAnalysisEffect(context.params.id!),

	options: {
		operationName: "getCampaignLtvAnalysis",
		requiredPermissions: ["campaigns.view"],
		errorContext: {
			feature: "campaign-analytics",
			action: "get-ltv-analysis",
		},
	},
});
