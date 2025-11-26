import {
	CustomerAgeVerificationSchema,
	CustomerResponseSchema,
} from "@repo/schema";
import { customerService } from "@repo/services";
import { createWorkspaceRoute } from "@/lib/api/create-api-route";

export const POST = createWorkspaceRoute({
	inputSchema: CustomerAgeVerificationSchema,
	outputSchema: CustomerResponseSchema,

	handler: async (data, { workspace, params }) => {
		return await customerService.verifyAge(params.id!, data, workspace.id);
	},

	options: {
		operationName: "verifyCustomerAge",
		requiredPermissions: ["customers.update"],
		errorContext: {
			feature: "customer-management",
			action: "verify-age",
		},
	},
});
