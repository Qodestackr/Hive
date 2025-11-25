import { createWorkspaceRoute } from "@/lib/api/create-api-route";
import { ProductFIFOBatchesResponseSchema } from "@repo/schema";
import { fifoService } from "@repo/services/src/fifo.service";

/**
 * GET /api/v1/products/[id]/fifo-batches
 * 
 * FIFO batch transparency endpoint
 * Shows batch-level cost tracking for audit trail
 */
export const GET = createWorkspaceRoute({
    outputSchema: ProductFIFOBatchesResponseSchema,

    handler: async (_, { workspace, params }) => {
        const productId = params.id as string;
        return await fifoService.getFIFOBatchesForProduct(productId, workspace.id);
    },

    options: {
        operationName: "getFIFOBatches",
        requiredPermissions: ["inventory.view"],
        errorContext: {
            feature: "fifo",
            action: "get-batches",
        },
    },
});

