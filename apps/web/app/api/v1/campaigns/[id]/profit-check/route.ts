import {
	type ProfitCheckRequest,
	ProfitCheckRequestSchema,
	ProfitCheckResponseSchema,
} from "@repo/schema";
import { profitAlertService } from "@repo/services";
import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";

export const POST = createWorkspaceRouteEffect({
	inputSchema: ProfitCheckRequestSchema,
	outputSchema: ProfitCheckResponseSchema,

	handler: (data: ProfitCheckRequest, context) =>
		profitAlertService.checkCampaignProfitMarginEffect(
			context.params.id!,
			data.createAlertIfBelowThreshold,
		),

	options: {
		operationName: "checkCampaignProfitMargin",
		requiredPermissions: ["campaigns.view"],
		errorContext: {
			feature: "profit-alerts",
			action: "check-profit-margin",
		},
	},
});
