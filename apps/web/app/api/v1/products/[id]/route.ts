import { createWorkspaceRoute } from "@/lib/api/create-api-route";
import {
    ProductResponseSchema,
    ProductUpdateSchema,
    SuccessResponseSchema,
} from "@repo/schema";
import { productService } from "@repo/services";
import { z } from "zod";

/**
 * GET /api/v1/products/:id
 * Get single product
 */
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

/**
 * PATCH /api/v1/products/:id
 * Update product
 */
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

/**
 * DELETE /api/v1/products/:id
 * Delete product (soft delete)
 */
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
