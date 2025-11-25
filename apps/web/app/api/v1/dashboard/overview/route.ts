import { createWorkspaceRoute } from "@/lib/api/create-api-route";
import { DashboardOverviewSchema } from "@repo/schema";
import { dashboardService } from "@repo/services";
import { z } from "zod";

/**
 * GET /api/v1/dashboard/overview
 * Get dashboard overview
 */
export const GET = createWorkspaceRoute({
    inputSchema: z.void(),
    outputSchema: DashboardOverviewSchema,

    handler: async (_, { workspace }) => {
        return await dashboardService.getOverview(workspace.id);
    },

    options: {
        operationName: "getDashboardOverview",
        requiredPermissions: ["dashboard.read"],
        errorContext: {
            feature: "dashboard",
            action: "overview",
        },
    },
});
