import {
	ProductResponseSchema,
	ProductUpdateSchema,
	SuccessResponseSchema,
} from "@repo/schema";
import { productService } from "@repo/services";
import { z } from "@repo/utils";
import { createWorkspaceRoute } from "@/lib/api/create-api-route";

export const GET = createWorkspaceRoute({
	inputSchema: z.void(),
	outputSchema: ProductResponseSchema,

	handler: async (_, { workspace, params }) => {
		return await productService.getById(params.id!, workspace.id);
	},

	options: {
		operationName: "getProduct",
		requiredPermissions: ["products.read"],
		errorContext: {
			feature: "product-management",
			action: "get",
		},
	},
});

export const PATCH = createWorkspaceRoute({
	inputSchema: ProductUpdateSchema,
	outputSchema: ProductResponseSchema,

	handler: async (data, { workspace, params }) => {
		return await productService.updateProduct(params.id!, data, workspace.id);
	},

	options: {
		operationName: "updateProduct",
		requiredPermissions: ["products.update"],
		errorContext: {
			feature: "product-management",
			action: "update",
		},
	},
});

export const DELETE = createWorkspaceRoute({
	inputSchema: z.void(),
	outputSchema: SuccessResponseSchema,

	handler: async (_, { workspace, params }) => {
		return await productService.deleteProduct(params.id!, workspace.id);
	},

	options: {
		operationName: "deleteProduct",
		requiredPermissions: ["products.delete"],
		errorContext: {
			feature: "product-management",
			action: "delete",
		},
	},
});
