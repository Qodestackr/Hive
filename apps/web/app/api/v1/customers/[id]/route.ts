import { createWorkspaceRoute } from "@/lib/api/create-api-route";
import {
    CustomerResponseSchema,
    CustomerUpdateSchema,
    SuccessResponseSchema,
} from "@repo/schema";
import { customerService } from "@repo/services";
import { z } from "zod";

/**
 * GET /api/v1/customers/:id
 * Get single customer
 */
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

/**
 * PATCH /api/v1/customers/:id
 * Update customer
 */
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

/**
 * DELETE /api/v1/customers/:id
 * Delete customer
 */
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
