import { createWorkspaceRoute } from "@/lib/api/create-api-route";
import {
    CustomerCreateSchema,
    CustomerResponseSchema,
    CustomerListQuerySchema,
    CustomerListResponseSchema,
} from "@repo/schema";
import { customerService } from "@repo/services";

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

export const GET = createWorkspaceRoute({
    inputSchema: CustomerListQuerySchema,
    outputSchema: CustomerListResponseSchema,
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
