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
        // Destructure with Type Assertion
        const { productId, actualPhysicalCount } = data as {
            productId: string;
            actualPhysicalCount: number
        };
        return await reconciliationService.reconcileProductStock(
            productId,
            workspace.id,
            actualPhysicalCount
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
