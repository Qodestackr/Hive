import { createWorkspaceRoute } from "@/lib/api/create-api-route";
import {
    ReconcileProductSchema,
    ReconciliationResultSchema,
} from "@repo/schema";
import { reconciliationService } from "@repo/services/src/reconciliation.service";

/**
 * POST /api/v1/reconciliation/product
 * 
 * Reconcile stock for a single product
 * THE TRUST ENGINE: Compares ledger (inventory_movements) vs actual stock
 */
export const POST = createWorkspaceRoute({
    inputSchema: ReconcileProductSchema,
    outputSchema: ReconciliationResultSchema,

    handler: async (data, { workspace }) => {
        return await reconciliationService.reconcileProductStock(
            data.productId,
            workspace.id,
            data.actualPhysicalCount
        );
    },

    options: {
        operationName: "reconcileProduct",
        requiredPermissions: ["inventory.reconcile"],
        errorContext: {
            feature: "reconciliation",
            action: "reconcile-product",
        },
    },
});
