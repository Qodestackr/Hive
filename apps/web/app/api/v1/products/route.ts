import {
	ProductCreateSchema,
	ProductListQuerySchema,
	ProductListResponseSchema,
	ProductResponseSchema,
} from "@repo/schema";
import { productService } from "@repo/services";
import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";

export const POST = createWorkspaceRouteEffect({
	inputSchema: ProductCreateSchema,
	outputSchema: ProductResponseSchema,

	handler: (data) => productService.createProductEffect(data),

	options: {
		operationName: "createProduct",
		requiredPermissions: ["products.create"],
		errorContext: {
			feature: "product-management",
			action: "create",
		},
	},
});

export const GET = createWorkspaceRouteEffect({
	inputSchema: ProductListQuerySchema,
	outputSchema: ProductListResponseSchema,
	handler: (query) => productService.listProductsEffect(query),

	options: {
		operationName: "listProducts",
		requiredPermissions: ["products.read"],
		errorContext: {
			feature: "product-management",
			action: "list",
		},
	},
});
