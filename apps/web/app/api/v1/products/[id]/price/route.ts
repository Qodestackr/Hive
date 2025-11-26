import { ProductPriceUpdateSchema, ProductResponseSchema } from "@repo/schema";
import { productService } from "@repo/services";
import { createWorkspaceRoute } from "@/lib/api/create-api-route";

export const PATCH = createWorkspaceRoute({
	inputSchema: ProductPriceUpdateSchema,
	outputSchema: ProductResponseSchema,

	handler: async (data, { workspace, params }) => {
		return await productService.updatePrice(params.id!, data, workspace.id);
	},

	options: {
		operationName: "updateProductPrice",
		requiredPermissions: ["products.update"],
		errorContext: {
			feature: "product-management",
			action: "price-update",
		},
	},
});
