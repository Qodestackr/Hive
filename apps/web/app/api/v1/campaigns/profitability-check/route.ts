import {
	CampaignProfitabilityCheckSchema,
	CampaignProfitabilityResponseSchema,
} from "@repo/schema";
import { campaignService } from "@repo/services/src/campaign.service";
import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";

export const POST = createWorkspaceRouteEffect({
	inputSchema: CampaignProfitabilityCheckSchema,
	outputSchema: CampaignProfitabilityResponseSchema,

	handler: (data) => campaignService.checkCampaignProfitabilityEffect(data),

	options: {
		operationName: "checkCampaignProfitability",
		requiredPermissions: ["campaigns.create"],
		errorContext: {
			feature: "profit-intelligence",
			action: "pre-flight-check",
		},
	},
});
