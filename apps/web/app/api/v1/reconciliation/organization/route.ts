import {
	ReconcileAllProductsSchema,
	ReconciliationSummarySchema,
} from "@repo/schema";
import { reconciliationService } from "@repo/services/src/reconciliation.service";
import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";

/**
 * POST `/api/v1/reconciliation/organization`
 *
 * Batch reconcile all products for an organization
 * Run nightly as background job to catch systemic discrepancies
 */
export const POST = createWorkspaceRouteEffect({
	inputSchema: ReconcileAllProductsSchema,
	outputSchema: ReconciliationSummarySchema,

	handler: () => reconciliationService.reconcileAllProductsEffect(),

	options: {
		operationName: "reconcileAllProducts",
		requiredPermissions: ["inventory.reconcile"],
		errorContext: {
			feature: "reconciliation",
			action: "reconcile-organization",
		},
	},
});
