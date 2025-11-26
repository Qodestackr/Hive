import { CustomerStatsSchema } from "@repo/schema";
import { customerService } from "@repo/services";
import { z } from "@repo/utils";
import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";

export const GET = createWorkspaceRouteEffect({
	inputSchema: z.void(),
	outputSchema: CustomerStatsSchema,

	handler: () => customerService.getStatsEffect(),

	options: {
		operationName: "getCustomerStats",
		requiredPermissions: ["customers.read"],
		errorContext: {
			feature: "customer-management",
			action: "stats",
		},
	},
});
