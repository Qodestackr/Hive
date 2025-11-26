import {
	PromoProfitAlertCreateSchema,
	PromoProfitAlertListQuerySchema,
	PromoProfitAlertListResponseSchema,
	PromoProfitAlertSchema,
} from "@repo/schema";
import { profitAlertService } from "@repo/services";
import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";

export const GET = createWorkspaceRouteEffect({
	inputSchema: PromoProfitAlertListQuerySchema,
	outputSchema: PromoProfitAlertListResponseSchema,

	handler: (data, context) =>
		profitAlertService.listAlertsEffect({
			...data,
			campaignId: context.params.id!,
		}),

	options: {
		operationName: "listCampaignAlerts",
		requiredPermissions: ["campaigns.view"],
		errorContext: {
			feature: "profit-alerts",
			action: "list-alerts",
		},
	},
});

export const POST = createWorkspaceRouteEffect({
	inputSchema: PromoProfitAlertCreateSchema,
	outputSchema: PromoProfitAlertSchema,

	handler: (data, context) =>
		profitAlertService.createAlertEffect({
			...data,
			campaignId: context.params.id!,
		}),

	options: {
		operationName: "createProfitAlert",
		requiredPermissions: ["campaigns.manage"],
		errorContext: {
			feature: "profit-alerts",
			action: "create-alert",
		},
	},
});
