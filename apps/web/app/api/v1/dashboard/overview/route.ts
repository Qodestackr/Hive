import { DashboardOverviewSchema } from "@repo/schema";
import { dashboardService } from "@repo/services";
import { z } from "@repo/utils";
import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";

export const GET = createWorkspaceRouteEffect({
	inputSchema: z.void(),
	outputSchema: DashboardOverviewSchema,

	handler: () => dashboardService.getOverviewEffect(),

	options: {
		operationName: "getDashboardOverview",
		requiredPermissions: ["dashboard.read"],
		errorContext: {
			feature: "dashboard",
			action: "overview",
		},
	},
});
