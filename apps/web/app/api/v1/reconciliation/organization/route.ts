import {
	ReconcileAllProductsSchema,
	ReconciliationSummarySchema,
} from "@repo/schema";
import { reconciliationService } from "@repo/services/src/reconciliation.service";
import { createWorkspaceRoute } from "@/lib/api/create-api-route";

/**
 * POST `/api/v1/reconciliation/organization`
 *
 * Batch reconcile all products for an organization
 * Run nightly as background job to catch systemic discrepancies
 */
export const POST = createWorkspaceRoute({
	inputSchema: ReconcileAllProductsSchema,
	outputSchema: ReconciliationSummarySchema,

	handler: async (_, { workspace }) => {
		return await reconciliationService.reconcileAllProducts(workspace.id);
	},

	options: {
		operationName: "reconcileAllProducts",
		requiredPermissions: ["inventory.reconcile"],
		errorContext: {
			feature: "reconciliation",
			action: "reconcile-organization",
		},
	},
});
