import { CustomerOptInSchema, CustomerResponseSchema } from "@repo/schema";
import { customerService } from "@repo/services";
import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";

export const POST = createWorkspaceRouteEffect({
	inputSchema: CustomerOptInSchema,
	outputSchema: CustomerResponseSchema,

	handler: (data, { params }) => customerService.optInEffect(params.id!, data),

	options: {
		operationName: "customerOptIn",
		requiredPermissions: ["customers.update"],
		errorContext: {
			feature: "customer-management",
			action: "opt-in",
		},
	},
});
