import {
	BulkProductPriceUpdateSchema,
	BulkUpdateResponseSchema,
} from "@repo/schema";
import { productService } from "@repo/services";
import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";

export const POST = createWorkspaceRouteEffect({
	inputSchema: BulkProductPriceUpdateSchema,
	outputSchema: BulkUpdateResponseSchema,

	handler: (data) => productService.bulkPriceUpdateEffect(data),

	options: {
		operationName: "bulkUpdateProductPrices",
		requiredPermissions: ["products.update"],
		errorContext: {
			feature: "product-management",
			action: "bulk-price-update",
		},
	},
});
