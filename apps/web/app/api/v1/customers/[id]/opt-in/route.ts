import { CustomerOptInSchema, CustomerResponseSchema } from "@repo/schema";
import { customerService } from "@repo/services";
import { createWorkspaceRoute } from "@/lib/api/create-api-route";

export const POST = createWorkspaceRoute({
	inputSchema: CustomerOptInSchema,
	outputSchema: CustomerResponseSchema,

	handler: async (data, { workspace, params }) => {
		return await customerService.optIn(params.id!, data, workspace.id);
	},

	options: {
		operationName: "customerOptIn",
		requiredPermissions: ["customers.update"],
		errorContext: {
			feature: "customer-management",
			action: "opt-in",
		},
	},
});
