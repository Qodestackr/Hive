import {
	BulkCustomerImportResponseSchema,
	BulkCustomerImportSchema,
} from "@repo/schema";
import { customerService } from "@repo/services";
import { createWorkspaceRoute } from "@/lib/api/create-api-route";

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
