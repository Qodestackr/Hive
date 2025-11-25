import { createWorkspaceRoute } from "@/lib/api/create-api-route";
import {
    CustomerAgeVerificationSchema,
    CustomerResponseSchema,
} from "@repo/schema";
import { customerService } from "@repo/services";

/**
 * POST /api/v1/customers/:id/verify-age
 * Verify customer age (COMPLIANCE GOLD)
 */
export const POST = createWorkspaceRoute({
    inputSchema: CustomerAgeVerificationSchema,
    outputSchema: CustomerResponseSchema,

    handler: async (data, { workspace, params }) => {
        return await customerService.verifyAge(params.id!, data, workspace.id);
    },

    options: {
        operationName: "verifyCustomerAge",
        requiredPermissions: ["customers.update"],
        errorContext: {
            feature: "customer-management",
            action: "verify-age",
        },
    },
});
