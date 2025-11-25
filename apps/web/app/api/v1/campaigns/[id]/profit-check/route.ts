import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";
import {
    ProfitCheckRequestSchema,
    ProfitCheckResponseSchema,
} from "@repo/schema";
import { profitAlertService } from "@repo/services";
import { Effect } from "effect";
import { GenericDatabaseError } from "@repo/utils/errors/domain";

// TODO: SSE on Events
export const GET = createWorkspaceRouteEffect({
    outputSchema: ProfitCheckResponseSchema,

    handler: (_, { workspace, params, searchParams }) => {
        const createAlert = searchParams.createAlert === 'true';

        return Effect.tryPromise({
            try: () => profitAlertService.checkCampaignProfitMargin(
                params.id!,
                workspace.id,
                createAlert
            ),
            catch: (error) => new GenericDatabaseError({
                operation: "checkCampaignProfitMargin",
                table: "campaigns",
                pgCode: undefined,
                detail: String(error),
                originalError: error
            })
        });
    },

    options: {
        operationName: "checkCampaignProfitMargin",
        requiredPermissions: ["campaigns.view"],
        errorContext: {
            feature: "profit-alerts",
            action: "check-margin",
        },
    },
});
