import {
	type CorrectDiscrepancy,
	CorrectDiscrepancySchema,
	CorrectionSuccessSchema,
} from "@repo/schema";
import { reconciliationService } from "@repo/services/src/reconciliation.service";
import { Effect } from "effect";
import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";

export const POST = createWorkspaceRouteEffect({
	inputSchema: CorrectDiscrepancySchema,
	outputSchema: CorrectionSuccessSchema,

	handler: (data: CorrectDiscrepancy) =>
		reconciliationService
			.correctInventoryDiscrepancyEffect(
				data.reconciliationLogId,
				data.correctionQty,
				data.reason,
			)
			.pipe(
				Effect.map(() => ({
					success: true as const,
					message: `Inventory corrected by ${data.correctionQty} units`,
					reconciliationLogId: data.reconciliationLogId,
				})),
			),

	options: {
		operationName: "correctInventoryDiscrepancy",
		requiredPermissions: ["inventory.correct"],
		errorContext: {
			feature: "reconciliation",
			action: "correct-discrepancy",
		},
	},
});
