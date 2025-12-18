import {
	CustomerResponseSchema,
	CustomerUpdateSchema,
	SuccessResponseSchema,
} from "@repo/schema";
import { customerService } from "@repo/services";
import { z } from "@repo/schema";
import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";

export const GET = createWorkspaceRouteEffect({
	inputSchema: z.void(),
	outputSchema: CustomerResponseSchema,

	handler: (_, { params }) => customerService.getByIdEffect(params.id!),

	options: {
		operationName: "getCustomer",
		requiredPermissions: ["customers.read"],
		errorContext: {
			feature: "customer-management",
			action: "get",
		},
	},
});

export const PATCH = createWorkspaceRouteEffect({
	inputSchema: CustomerUpdateSchema,
	outputSchema: CustomerResponseSchema,

	handler: (data, { params }) =>
		customerService.updateCustomerEffect(params.id!, data),

	options: {
		operationName: "updateCustomer",
		requiredPermissions: ["customers.update"],
		errorContext: {
			feature: "customer-management",
			action: "update",
		},
	},
});

export const DELETE = createWorkspaceRouteEffect({
	inputSchema: z.void(),
	outputSchema: SuccessResponseSchema,

	handler: (_, { params }) => customerService.deleteCustomerEffect(params.id!),

	options: {
		operationName: "deleteCustomer",
		requiredPermissions: ["customers.delete"],
		errorContext: {
			feature: "customer-management",
			action: "delete",
		},
	},
});
