import { CustomerOptOutSchema, CustomerResponseSchema } from "@repo/schema";
import { customerService } from "@repo/services";
import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";

export const POST = createWorkspaceRouteEffect({
	inputSchema: CustomerOptOutSchema,
	outputSchema: CustomerResponseSchema,

	handler: (data, { params }) => customerService.optOutEffect(params.id!, data),

	options: {
		operationName: "customerOptOut",
		requiredPermissions: ["customers.update"],
		errorContext: {
			feature: "customer-management",
			action: "opt-out",
		},
	},
});
