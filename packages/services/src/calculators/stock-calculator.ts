export interface WeightedAverageCostParams {
	batches: Array<{
		unitCost: number;
		quantityReceived: number;
		quantityUsed: number;
	}>;
}

export interface StockAfterMovementParams {
	currentStock: number;
	movementQuantity: number;
}

export interface ReconciliationDiscrepancyParams {
	expectedQuantity: number;
	actualQuantity: number;
	tolerance?: number;
}

export interface ReconciliationDiscrepancyResult {
	isInSync: boolean;
	discrepancy: number;
	requiresAction: boolean;
}

export class StockCalculator {
	static calculateWeightedAverageCost(
		params: WeightedAverageCostParams,
	): number {
		const { batches } = params;

		if (batches.length === 0) {
			return 0;
		}

		let totalValue = 0;
		let totalQuantity = 0;

		for (const batch of batches) {
			const remaining =
				(batch.quantityReceived ?? 0) - (batch.quantityUsed ?? 0);
			if (remaining > 0) {
				totalValue += batch.unitCost * remaining;
				totalQuantity += remaining;
			}
		}

		return totalQuantity > 0 ? totalValue / totalQuantity : 0;
	}

	static calculateStockAfterMovement(params: StockAfterMovementParams): number {
		return params.currentStock + params.movementQuantity;
	}

	static calculateReconciliationDiscrepancy(
		params: ReconciliationDiscrepancyParams,
	): ReconciliationDiscrepancyResult {
		const { expectedQuantity, actualQuantity, tolerance = 1 } = params;

		const discrepancy = expectedQuantity - actualQuantity;
		const isInSync = Math.abs(discrepancy) <= tolerance;

		return {
			isInSync,
			discrepancy,
			requiresAction: !isInSync,
		};
	}
}
