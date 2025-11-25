import { createWorkspaceRoute } from "@/lib/api/create-api-route";
import {
    CustomerCreateSchema,
    CustomerResponseSchema,
    CustomerListQuerySchema,
    CustomerListResponseSchema,
} from "@repo/schema";
import { customerService } from "@repo/services";

/**
 * POST /api/v1/customers
 * Create a single customer
 */
export const POST = createWorkspaceRoute({
    inputSchema: CustomerCreateSchema,
    outputSchema: CustomerResponseSchema,

    handler: async (data, { workspace }) => {
        return await customerService.createCustomer(data, workspace.id);
    },

    options: {
        operationName: "createCustomer",
        requiredPermissions: ["customers.create"],
        errorContext: {
            feature: "customer-management",
            action: "create",
        },
    },
});

/**
 * GET /api/v1/customers
 * List customers with filters
 */
export const GET = createWorkspaceRoute({
    inputSchema: CustomerListQuerySchema,
    outputSchema: CustomerListResponseSchema,
    inputType: "query",

    handler: async (query, { workspace }) => {
        return await customerService.listCustomers(query, workspace.id);
    },

    options: {
        operationName: "listCustomers",
        requiredPermissions: ["customers.read"],
        errorContext: {
            feature: "customer-management",
            action: "list",
        },
    },
});
