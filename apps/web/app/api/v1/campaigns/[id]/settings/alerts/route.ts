import {
	AlertSettingsResponseSchema,
	AlertSettingsUpdateSchema,
} from "@repo/schema";
import { profitAlertService } from "@repo/services";
import { z } from "@repo/utils";
import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";

export const GET = createWorkspaceRouteEffect({
	inputSchema: z.void(),
	outputSchema: AlertSettingsResponseSchema,

	handler: (_data, context) =>
		profitAlertService.getAlertSettingsEffect(context.params.id!),

	options: {
		operationName: "getAlertSettings",
		requiredPermissions: ["campaigns.view"],
		errorContext: {
			feature: "profit-alerts",
			action: "get-settings",
		},
	},
});

export const PATCH = createWorkspaceRouteEffect({
	inputSchema: AlertSettingsUpdateSchema,
	outputSchema: AlertSettingsResponseSchema,

	handler: (data, context) =>
		profitAlertService.updateAlertSettingsEffect(context.params.id!, data),

	options: {
		operationName: "updateAlertSettings",
		requiredPermissions: ["campaigns.manage"],
		errorContext: {
			feature: "profit-alerts",
			action: "update-settings",
		},
	},
});
