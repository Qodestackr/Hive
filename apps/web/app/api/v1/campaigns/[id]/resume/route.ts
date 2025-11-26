import { CampaignResponseSchema } from "@repo/schema";
import { campaignService } from "@repo/services";
import { z } from "@repo/utils";
import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";

export const POST = createWorkspaceRouteEffect({
	inputSchema: z.void(),
	outputSchema: CampaignResponseSchema,

	handler: (_, { params }) => campaignService.resumeCampaignEffect(params.id!),

	options: {
		operationName: "resumeCampaign",
		requiredPermissions: ["campaigns.update"],
		errorContext: {
			feature: "campaign-management",
			action: "resume",
		},
	},
});
