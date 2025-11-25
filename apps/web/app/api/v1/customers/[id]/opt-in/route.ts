import { createWorkspaceRoute } from "@/lib/api/create-api-route";
import {
    CustomerOptInSchema,
    CustomerResponseSchema,
} from "@repo/schema";
import { customerService } from "@repo/services";

/**
 * POST /api/v1/customers/:id/opt-in
 * Customer opt-in
 */
export const POST = createWorkspaceRoute({
    inputSchema: CustomerOptInSchema,
    outputSchema: CustomerResponseSchema,

    handler: async (data, { workspace, params }) => {
        return await customerService.optIn(params.id!, data, workspace.id);
    },

    options: {
        operationName: "customerOptIn",
        requiredPermissions: ["customers.update"],
        errorContext: {
            feature: "customer-management",
            action: "opt-in",
        },
    },
});
