import {
	PurchaseOrderResponseSchema,
	QuickStockArrivalSchema,
} from "@repo/schema";
import { purchaseOrderService } from "@repo/services/src/purchase-order.service";
import { GenericDatabaseError } from "@repo/utils/errors/domain";
import { Effect } from "effect";
import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";

/**
 * POST `/api/v1/purchase-orders/quick-arrival`
 *
 * Quick stock arrival - 30-second stock entry for onboarding
 * Creates FIFO batch with unitCost tracking
 *
 * CRITICAL: This sets FIFO costs that affect ALL future profit calculations
 */
export const POST = createWorkspaceRouteEffect({
	inputSchema: QuickStockArrivalSchema,
	outputSchema: PurchaseOrderResponseSchema,

	handler: (data) => purchaseOrderService.quickStockArrivalEffect(data),

	options: {
		operationName: "quickStockArrival",
		requiredPermissions: ["inventory.write"],
		errorContext: {
			feature: "fifo",
			action: "quick-stock-arrival",
		},
	},
});
