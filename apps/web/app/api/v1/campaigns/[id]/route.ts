import { CampaignResponseSchema } from "@repo/schema";
import { campaignService } from "@repo/services";
import { z } from "@repo/schema";
import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";

export const GET = createWorkspaceRouteEffect({
	inputSchema: z.void(),
	outputSchema: CampaignResponseSchema,

	handler: (_data, context) =>
		campaignService.getCampaignByIdEffect(context.params.id!),

	options: {
		operationName: "getCampaignById",
		requiredPermissions: ["campaigns.view"],
		errorContext: {
			feature: "campaigns",
			action: "get-by-id",
		},
	},
});
