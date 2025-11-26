import { createWorkspaceRoute } from "@/lib/api/create-api-route";
import { PromoProfitAlertSummarySchema } from "@repo/schema";
import { profitAlertService } from "@repo/services";

export const GET = createWorkspaceRoute({
    outputSchema: PromoProfitAlertSummarySchema,

    handler: async (_, { workspace }) => {
        return await profitAlertService.getAlertSummary(workspace.id);
    },

    options: {
        operationName: "getAlertSummary",
        requiredPermissions: ["campaigns.view"],
        cacheResponse: true,
        cacheTTL: 60,
        errorContext: {
            feature: "profit-alerts",
            action: "get-summary",
        },
    },
});