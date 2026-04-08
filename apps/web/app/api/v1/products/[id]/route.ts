import {
	ProductResponseSchema,
	ProductUpdateSchema,
	SuccessResponseSchema,
} from "@repo/schema";
import { productService } from "@repo/services";
import { z } from "@repo/schema";
import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";

export const GET = createWorkspaceRouteEffect({
	inputSchema: z.void(),
	outputSchema: ProductResponseSchema,

	handler: (_, { params }) => productService.getByIdEffect(params.id!),

	options: {
		operationName: "getProduct",
		requiredPermissions: ["products.read"],
		errorContext: {
			feature: "product-management",
			action: "get",
		},
	},
});

export const PATCH = createWorkspaceRouteEffect({
	inputSchema: ProductUpdateSchema,
	outputSchema: ProductResponseSchema,

	handler: (data, { params }) =>
		productService.updateProductEffect(params.id!, data),

	options: {
		operationName: "updateProduct",
		requiredPermissions: ["products.update"],
		errorContext: {
			feature: "product-management",
			action: "update",
		},
	},
});

export const DELETE = createWorkspaceRouteEffect({
	inputSchema: z.void(),
	outputSchema: SuccessResponseSchema,

	handler: (_, { params }) => productService.deleteProductEffect(params.id!),

	options: {
		operationName: "deleteProduct",
		requiredPermissions: ["products.delete"],
		errorContext: {
			feature: "product-management",
			action: "delete",
		},
	},
});
