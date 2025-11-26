import {
	PromoProfitAlertResolveSchema,
	PromoProfitAlertSchema,
} from "@repo/schema";
import { profitAlertService } from "@repo/services";
import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";

export const PATCH = createWorkspaceRouteEffect({
	inputSchema: PromoProfitAlertResolveSchema,
	outputSchema: PromoProfitAlertSchema,

	handler: (data, context) =>
		profitAlertService.resolveAlertEffect(context.params.alertId!, data),

	options: {
		operationName: "resolveProfitAlert",
		requiredPermissions: ["campaigns.manage"],
		errorContext: {
			feature: "profit-alerts",
			action: "resolve-alert",
		},
	},
});
