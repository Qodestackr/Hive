import {
	BulkCustomerImportResponseSchema,
	BulkCustomerImportSchema,
} from "@repo/schema";
import { customerService } from "@repo/services";
import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";

export const POST = createWorkspaceRouteEffect({
	inputSchema: BulkCustomerImportSchema,
	outputSchema: BulkCustomerImportResponseSchema,

	handler: (data) => customerService.bulkImportEffect(data),

	options: {
		operationName: "bulkImportCustomers",
		requiredPermissions: ["customers.create"],
		errorContext: {
			feature: "customer-management",
			action: "bulk-import",
		},
	},
});
