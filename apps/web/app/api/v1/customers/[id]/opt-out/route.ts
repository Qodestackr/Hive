import { createWorkspaceRoute } from "@/lib/api/create-api-route";
import {
    CustomerOptOutSchema,
    CustomerResponseSchema,
} from "@repo/schema";
import { customerService } from "@repo/services";

export const POST = createWorkspaceRoute({
    inputSchema: CustomerOptOutSchema,
    outputSchema: CustomerResponseSchema,

    handler: async (data, { workspace, params }) => {
        return await customerService.optOut(params.id!, data, workspace.id);
    },

    options: {
        operationName: "customerOptOut",
        requiredPermissions: ["customers.update"],
        errorContext: {
            feature: "customer-management",
            action: "opt-out",
        },
    },
});
