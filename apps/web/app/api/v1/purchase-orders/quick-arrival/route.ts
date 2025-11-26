import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";
import {
    QuickStockArrivalSchema,
    PurchaseOrderResponseSchema,
} from "@repo/schema";
import { purchaseOrderService } from "@repo/services/src/purchase-order.service";
import { Effect } from "effect";
import { GenericDatabaseError } from "@repo/utils/errors/domain";

/**
 * POST `/api/v1/purchase-orders/quick-arrival`
 * 
 * Quick stock arrival - 30-second stock entry for onboarding
 * THE GOLD: Creates FIFO batch with unitCost tracking
 * 
 * CRITICAL: This sets FIFO costs that affect ALL future profit calculations
 */
export const POST = createWorkspaceRouteEffect({
    inputSchema: QuickStockArrivalSchema,
    outputSchema: PurchaseOrderResponseSchema,

    handler: (data, { workspace }) =>
        Effect.tryPromise({
            try: () => purchaseOrderService.quickStockArrival(data, workspace.id),
            catch: (error) => new GenericDatabaseError({
                operation: "quickStockArrival",
                table: "purchase_orders",
                pgCode: undefined,
                detail: String(error),
                originalError: error
            })
        }),

    options: {
        operationName: "quickStockArrival",
        requiredPermissions: ["inventory.write"],
        errorContext: {
            feature: "fifo",
            action: "quick-stock-arrival",
        },
    },
});
