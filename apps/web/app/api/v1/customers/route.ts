import {
	CustomerCreateSchema,
	CustomerListQuerySchema,
	CustomerListResponseSchema,
	CustomerResponseSchema,
} from "@repo/schema";
import { customerService } from "@repo/services";
import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";

export const POST = createWorkspaceRouteEffect({
	inputSchema: CustomerCreateSchema,
	outputSchema: CustomerResponseSchema,

	handler: (data) => customerService.createCustomerEffect(data),

	options: {
		operationName: "createCustomer",
		requiredPermissions: ["customers.create"],
		errorContext: {
			feature: "customer-management",
			action: "create",
		},
	},
});

export const GET = createWorkspaceRouteEffect({
	inputSchema: CustomerListQuerySchema,
	outputSchema: CustomerListResponseSchema,
	handler: (query) => customerService.listCustomersEffect(query),

	options: {
		operationName: "listCustomers",
		requiredPermissions: ["customers.read"],
		errorContext: {
			feature: "customer-management",
			action: "list",
		},
	},
});
