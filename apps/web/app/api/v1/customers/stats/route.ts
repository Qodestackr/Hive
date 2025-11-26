import { CustomerStatsSchema } from "@repo/schema";
import { customerService } from "@repo/services";
import { z } from "@repo/utils";
import { createWorkspaceRoute } from "@/lib/api/create-api-route";

export const GET = createWorkspaceRoute({
	inputSchema: z.void(),
	outputSchema: CustomerStatsSchema,

	handler: async (_, { workspace }) => {
		return await customerService.getStats(workspace.id);
	},

	options: {
		operationName: "getCustomerStats",
		requiredPermissions: ["customers.read"],
		errorContext: {
			feature: "customer-management",
			action: "stats",
		},
	},
});
