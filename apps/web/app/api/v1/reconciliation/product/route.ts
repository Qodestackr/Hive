import {
	type ReconcileProduct,
	ReconcileProductSchema,
	ReconciliationResultSchema,
} from "@repo/schema";
import { reconciliationService } from "@repo/services/src/reconciliation.service";
import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";

/**
 * POST /api/v1/reconciliation/product
 *
 * Reconcile stock for a single product
 * THE TRUST ENGINE: Compares ledger (inventory_movements) vs actual stock
 */
export const POST = createWorkspaceRouteEffect({
	inputSchema: ReconcileProductSchema,
	outputSchema: ReconciliationResultSchema,

	handler: (data: ReconcileProduct) =>
		reconciliationService.reconcileProductStockEffect(
			data.productId,
			data.actualPhysicalCount,
		),

	options: {
		operationName: "reconcileProduct",
		requiredPermissions: ["inventory.reconcile"],
		errorContext: {
			feature: "reconciliation",
			action: "reconcile-product",
		},
	},
});
