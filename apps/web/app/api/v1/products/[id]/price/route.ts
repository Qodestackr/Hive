import { ProductPriceUpdateSchema, ProductResponseSchema } from "@repo/schema";
import { productService } from "@repo/services";
import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";

export const PATCH = createWorkspaceRouteEffect({
	inputSchema: ProductPriceUpdateSchema,
	outputSchema: ProductResponseSchema,

	handler: (data, { params }) =>
		productService.updatePriceEffect(params.id!, data),

	options: {
		operationName: "updateProductPrice",
		requiredPermissions: ["products.update"],
		errorContext: {
			feature: "product-management",
			action: "price-update",
		},
	},
});
