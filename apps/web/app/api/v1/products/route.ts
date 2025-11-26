import {
	ProductCreateSchema,
	ProductListQuerySchema,
	ProductListResponseSchema,
	ProductResponseSchema,
} from "@repo/schema";
import { productService } from "@repo/services";
import { createWorkspaceRoute } from "@/lib/api/create-api-route";

export const POST = createWorkspaceRoute({
	inputSchema: ProductCreateSchema,
	outputSchema: ProductResponseSchema,

	handler: async (data, { workspace }) => {
		return await productService.createProduct(data, workspace.id);
	},

	options: {
		operationName: "createProduct",
		requiredPermissions: ["products.create"],
		errorContext: {
			feature: "product-management",
			action: "create",
		},
	},
});

export const GET = createWorkspaceRoute({
	inputSchema: ProductListQuerySchema,
	outputSchema: ProductListResponseSchema,
	handler: async (query, { workspace }) => {
		return await productService.listProducts(query, workspace.id);
	},

	options: {
		operationName: "listProducts",
		requiredPermissions: ["products.read"],
		errorContext: {
			feature: "product-management",
			action: "list",
		},
	},
});
