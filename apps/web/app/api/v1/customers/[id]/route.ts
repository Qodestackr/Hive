import { createWorkspaceRoute } from "@/lib/api/create-api-route";
import {
    CustomerResponseSchema,
    CustomerUpdateSchema,
    SuccessResponseSchema,
} from "@repo/schema";
import { customerService } from "@repo/services";
import { z } from "@repo/utils";

export const GET = createWorkspaceRoute({
    inputSchema: z.void(),
    outputSchema: CustomerResponseSchema,

    handler: async (_, { workspace, params }) => {
        return await customerService.getById(params.id!, workspace.id);
    },

    options: {
        operationName: "getCustomer",
        requiredPermissions: ["customers.read"],
        errorContext: {
            feature: "customer-management",
            action: "get",
        },
    },
});

export const PATCH = createWorkspaceRoute({
    inputSchema: CustomerUpdateSchema,
    outputSchema: CustomerResponseSchema,

    handler: async (data, { workspace, params }) => {
        return await customerService.updateCustomer(params.id!, data, workspace.id);
    },

    options: {
        operationName: "updateCustomer",
        requiredPermissions: ["customers.update"],
        errorContext: {
            feature: "customer-management",
            action: "update",
        },
    },
});

export const DELETE = createWorkspaceRoute({
    inputSchema: z.void(),
    outputSchema: SuccessResponseSchema,

    handler: async (_, { workspace, params }) => {
        return await customerService.deleteCustomer(params.id!, workspace.id);
    },

    options: {
        operationName: "deleteCustomer",
        requiredPermissions: ["customers.delete"],
        errorContext: {
            feature: "customer-management",
            action: "delete",
        },
    },
});
