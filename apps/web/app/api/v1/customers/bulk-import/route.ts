import { createWorkspaceRoute } from "@/lib/api/create-api-route";
import {
    BulkCustomerImportSchema,
    BulkCustomerImportResponseSchema,
} from "@repo/schema";
import { customerService } from "@repo/services";

/**
 * POST /api/v1/customers/bulk-import
 * Bulk import customers (CSV)
 */
export const POST = createWorkspaceRoute({
    inputSchema: BulkCustomerImportSchema,
    outputSchema: BulkCustomerImportResponseSchema,

    handler: async (data, { workspace }) => {
        return await customerService.bulkImport(data, workspace.id);
    },

    options: {
        operationName: "bulkImportCustomers",
        requiredPermissions: ["customers.create"],
        errorContext: {
            feature: "customer-management",
            action: "bulk-import",
        },
    },
});
