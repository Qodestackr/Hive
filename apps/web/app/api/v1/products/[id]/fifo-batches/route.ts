import { ProductFIFOBatchesResponseSchema } from "@repo/schema";
import { fifoService } from "@repo/services/src/fifo.service";
import { createWorkspaceRoute } from "@/lib/api/create-api-route";

// batch-level cost tracking for audit trail
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
