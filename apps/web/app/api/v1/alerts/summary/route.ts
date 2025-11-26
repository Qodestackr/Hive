import { PromoProfitAlertSummarySchema } from "@repo/schema";
import { profitAlertService } from "@repo/services";
import { z } from "@repo/utils";
import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";

export const GET = createWorkspaceRouteEffect({
	inputSchema: z.void(),
	outputSchema: PromoProfitAlertSummarySchema,

	handler: () => profitAlertService.getAlertSummaryEffect(),

	options: {
		operationName: "getAlertSummary",
		requiredPermissions: ["campaigns.view"],
		errorContext: {
			feature: "profit-alerts",
			action: "get-summary",
		},
	},
});
