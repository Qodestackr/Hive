import { createWorkspaceRoute } from "@/lib/api/create-api-route";
import { BulkProductPriceUpdateSchema, BulkUpdateResponseSchema } from "@repo/schema";
import { productService } from "@repo/services";

/**
 * POST /api/v1/products/bulk-price-update
 * Bulk price updates
 */
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
