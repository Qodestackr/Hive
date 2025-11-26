import {
	CustomerAgeVerificationSchema,
	CustomerResponseSchema,
} from "@repo/schema";
import { customerService } from "@repo/services";
import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";

export const POST = createWorkspaceRouteEffect({
	inputSchema: CustomerAgeVerificationSchema,
	outputSchema: CustomerResponseSchema,

	handler: (data, { params }) =>
		customerService.verifyAgeEffect(params.id!, data),

	options: {
		operationName: "verifyCustomerAge",
		requiredPermissions: ["customers.update"],
		errorContext: {
			feature: "customer-management",
			action: "verify-age",
		},
	},
});
