import { CampaignResponseSchema } from "@repo/schema";
import { campaignService } from "@repo/services";
import { z } from "@repo/utils";
import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";

export const POST = createWorkspaceRouteEffect({
	inputSchema: z.void(),
	outputSchema: CampaignResponseSchema,

	handler: (_, { params }) => campaignService.pauseCampaignEffect(params.id!),

	options: {
		operationName: "pauseCampaign",
		requiredPermissions: ["campaigns.update"],
		errorContext: {
			feature: "campaign-management",
			action: "pause",
		},
	},
});
