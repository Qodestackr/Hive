import { createId } from "@paralleldrive/cuid2";

export interface StockArrivalMutations {
	purchaseOrder: {
		id: string;
		organizationId: string;
		poNumber: string;
		supplierName: string;
		status: "received";
		orderDate: string;
		receivedDate: string;
		totalCost: number;
		currency: string;
	};
	purchaseOrderItem: {
		id: string;
		purchaseOrderId: string;
		productId: string;
		quantityOrdered: number;
		quantityReceived: number;
		unitCost: number;
		batchNumber: string | null;
		expiryDate: string | null;
		lineTotal: number;
	};
	inventoryMovement: {
		id: string;
		organizationId: string;
		productId: string;
		movementType: "purchase";
		quantity: number;
		unitCostAtMovement: number;
		totalCost: number;
		fifoBatchId: string;
		referenceType: "purchase_order";
		referenceId: string;
		stockAfterMovement: number;
	};
	productUpdate: {
		id: string;
		currentStockQuantity: number;
		currentFIFOCost: number;
		updatedAt: Date;
	};
}

export interface ReconciliationMutations {
	reconciliationLog: {
		id: string;
		organizationId: string;
		productId: string;
		expectedQuantity: number;
		actualQuantity: number;
		discrepancy: number;
		isResolved: false;
	};
	alert: {
		id: string;
		organizationId: string;
		campaignId: null;
		productId: string;
		alertType: "inventory_discrepancy";
		severity: "critical" | "high";
		message: string;
		currentFIFOCost: number | null;
		redemptionsCount: null;
		totalLoss: null;
		estimatedLossPerRedemption: null;
		isResolved: false;
	};
}

export interface CorrectionMutations {
	inventoryMovement: {
		id: string;
		organizationId: string;
		productId: string;
		movementType: "correction";
		quantity: number;
		unitCostAtMovement: 0;
		totalCost: 0;
		fifoBatchId: null;
		referenceType: "manual_correction";
		referenceId: string;
		stockAfterMovement: number;
		notes: string;
	};
	reconciliationLogUpdate: {
		id: string;
		isResolved: true;
		resolvedAt: Date;
		resolutionNotes: string;
	};
}

export function buildStockArrivalMutations(params: {
	productId: string;
	organizationId: string;
	quantity: number;
	unitCost: number;
	supplierName: string;
	batchNumber?: string;
	expiryDate?: string;
	currentStock: number;
	newFIFOCost: number;
}): StockArrivalMutations {
	const purchaseOrderId = createId();
	const purchaseOrderItemId = createId();
	const poNumber = `PO-${Date.now()}`;
	const now = new Date().toISOString();

	return {
		purchaseOrder: {
			id: purchaseOrderId,
			organizationId: params.organizationId,
			poNumber,
			supplierName: params.supplierName || "Quick Entry",
			status: "received",
			orderDate: now,
			receivedDate: now,
			totalCost: params.unitCost * params.quantity,
			currency: "KES",
		},
		purchaseOrderItem: {
			id: purchaseOrderItemId,
			purchaseOrderId,
			productId: params.productId,
			quantityOrdered: params.quantity,
			quantityReceived: params.quantity,
			unitCost: params.unitCost,
			batchNumber: params.batchNumber || null,
			expiryDate: params.expiryDate || null,
			lineTotal: params.unitCost * params.quantity,
		},
		inventoryMovement: {
			id: createId(),
			organizationId: params.organizationId,
			productId: params.productId,
			movementType: "purchase",
			quantity: params.quantity,
			unitCostAtMovement: params.unitCost,
			totalCost: params.unitCost * params.quantity,
			fifoBatchId: purchaseOrderItemId,
			referenceType: "purchase_order",
			referenceId: purchaseOrderId,
			stockAfterMovement: params.currentStock + params.quantity,
		},
		productUpdate: {
			id: params.productId,
			currentStockQuantity: params.currentStock + params.quantity,
			currentFIFOCost: params.newFIFOCost,
			updatedAt: new Date(),
		},
	};
}

export function buildReconciliationMutations(params: {
	organizationId: string;
	productId: string;
	productName: string;
	expectedQuantity: number;
	actualQuantity: number;
	discrepancy: number;
	currentFIFOCost: number | null;
}): ReconciliationMutations {
	const severity: "critical" | "high" =
		Math.abs(params.discrepancy) > 10 ? "critical" : "high";

	return {
		reconciliationLog: {
			id: createId(),
			organizationId: params.organizationId,
			productId: params.productId,
			expectedQuantity: params.expectedQuantity,
			actualQuantity: params.actualQuantity,
			discrepancy: params.discrepancy,
			isResolved: false,
		},
		alert: {
			id: createId(),
			organizationId: params.organizationId,
			campaignId: null,
			productId: params.productId,
			alertType: "inventory_discrepancy",
			severity,
			message: `Stock mismatch for ${params.productName}: Expected ${params.expectedQuantity}, Found ${params.actualQuantity} (Δ ${params.discrepancy})`,
			currentFIFOCost: params.currentFIFOCost,
			redemptionsCount: null,
			totalLoss: null,
			estimatedLossPerRedemption: null,
			isResolved: false,
		},
	};
}

export function buildCorrectionMutations(params: {
	reconciliationLogId: string;
	organizationId: string;
	productId: string;
	correctionQty: number;
	actualQuantity: number;
	reason: string;
}): CorrectionMutations {
	return {
		inventoryMovement: {
			id: createId(),
			organizationId: params.organizationId,
			productId: params.productId,
			movementType: "correction",
			quantity: params.correctionQty,
			unitCostAtMovement: 0,
			totalCost: 0,
			fifoBatchId: null,
			referenceType: "manual_correction",
			referenceId: params.reconciliationLogId,
			stockAfterMovement: params.actualQuantity + params.correctionQty,
			notes: `Manual correction: ${params.reason}`,
		},
		reconciliationLogUpdate: {
			id: params.reconciliationLogId,
			isResolved: true,
			resolvedAt: new Date(),
			resolutionNotes: params.reason,
		},
	};
}
