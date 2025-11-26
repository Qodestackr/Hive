import { ProductFIFOBatchesResponseSchema } from "@repo/schema";
import { fifoService } from "@repo/services/src/fifo.service";
import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";

// batch-level cost tracking for audit trail
export const GET = createWorkspaceRouteEffect({
	outputSchema: ProductFIFOBatchesResponseSchema,

	handler: (_, { params }) =>
		fifoService.getFIFOBatchesForProductEffect(params.id!),

	options: {
		operationName: "getFIFOBatches",
		requiredPermissions: ["inventory.view"],
		errorContext: {
			feature: "fifo",
			action: "get-batches",
		},
	},
});
