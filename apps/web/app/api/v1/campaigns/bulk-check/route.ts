import {
	BulkProfitCheckRequestSchema,
	BulkProfitCheckResponseSchema,
} from "@repo/schema";
import { profitAlertService } from "@repo/services";
import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";

export const POST = createWorkspaceRouteEffect({
	inputSchema: BulkProfitCheckRequestSchema,
	outputSchema: BulkProfitCheckResponseSchema,

	handler: (data) => profitAlertService.bulkProfitCheckEffect(data),

	options: {
		operationName: "bulkProfitCheck",
		requiredPermissions: ["campaigns.view"],
		errorContext: {
			feature: "profit-alerts",
			action: "bulk-check",
		},
	},
});
