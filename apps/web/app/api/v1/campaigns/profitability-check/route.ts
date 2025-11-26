import {
	CampaignProfitabilityCheckSchema,
	CampaignProfitabilityResponseSchema,
} from "@repo/schema";
import { campaignService } from "@repo/services/src/campaign.service";
import { GenericDatabaseError } from "@repo/utils/errors/domain";
import { Effect } from "effect";
import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";

export const POST = createWorkspaceRouteEffect({
	inputSchema: CampaignProfitabilityCheckSchema,
	outputSchema: CampaignProfitabilityResponseSchema,

	handler: (data, { workspace }) =>
		Effect.tryPromise({
			try: () => campaignService.checkCampaignProfitability(data, workspace.id),
			catch: (error) =>
				new GenericDatabaseError({
					operation: "checkCampaignProfitability",
					table: "campaigns",
					pgCode: undefined,
					detail: String(error),
					originalError: error,
				}),
		}),

	options: {
		operationName: "checkCampaignProfitability",
		requiredPermissions: ["campaigns.create"],
		errorContext: {
			feature: "profit-intelligence",
			action: "pre-flight-check",
		},
	},
});
