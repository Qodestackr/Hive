import {
	BulkProductPriceUpdateSchema,
	BulkUpdateResponseSchema,
} from "@repo/schema";
import { productService } from "@repo/services";
import { createWorkspaceRoute } from "@/lib/api/create-api-route";

export const POST = createWorkspaceRoute({
	inputSchema: BulkProductPriceUpdateSchema,
	outputSchema: BulkUpdateResponseSchema,

	handler: async (data, { workspace }) => {
		return await productService.bulkPriceUpdate(data, workspace.id);
	},

	options: {
		operationName: "bulkUpdateProductPrices",
		requiredPermissions: ["products.update"],
		errorContext: {
			feature: "product-management",
			action: "bulk-price-update",
		},
	},
});
