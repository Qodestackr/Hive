import { createWorkspaceRoute } from "@/lib/api/create-api-route";
import {
    ProductCreateSchema,
    ProductResponseSchema,
    ProductListQuerySchema,
    ProductListResponseSchema,
} from "@repo/schema";
import { productService } from "@repo/services";

/**
 * POST /api/v1/products
 * Create a product
 */
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

/**
 * GET /api/v1/products
 * List products with filters
 */
export const GET = createWorkspaceRoute({
    inputSchema: ProductListQuerySchema,
    outputSchema: ProductListResponseSchema,
    inputType: "query",

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
