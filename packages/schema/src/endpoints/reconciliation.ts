import { z } from "zod";
import {
	CorrectDiscrepancySchema,
	CorrectionSuccessSchema,
	ReconcileAllProductsSchema,
	ReconcileProductSchema,
	ReconciliationResultSchema,
	ReconciliationSummarySchema,
} from "../products/reconciliation.schema.js";
import { registerRoute } from "../utils/route-builder.js";

// Reconcile single product
registerRoute({
	method: "post",
	path: "/api/v1/reconciliation/product",
	summary: "Reconcile product stock",
	description:
		"Verify product inventory matches expected FIFO calculations (Trust Engine).",
	tags: ["Reconciliation", "FIFO"],
	body: ReconcileProductSchema,
	response: ReconciliationResultSchema,
	errors: {
		400: "Invalid input data",
		404: "Product not found",
	},
});

// Reconcile all products
registerRoute({
	method: "post",
	path: "/api/v1/reconciliation/all",
	summary: "Reconcile all products",
	description:
		"Run reconciliation check across all products in the organization.",
	tags: ["Reconciliation", "FIFO"],
	body: ReconcileAllProductsSchema,
	response: ReconciliationSummarySchema,
});

// Correct inventory discrepancy
registerRoute({
	method: "post",
	path: "/api/v1/reconciliation/correct",
	summary: "Correct inventory discrepancy",
	description:
		"Apply manual correction to resolve inventory discrepancy (with audit trail).",
	tags: ["Reconciliation", "FIFO"],
	body: CorrectDiscrepancySchema,
	response: CorrectionSuccessSchema,
	errors: {
		400: "Invalid input data",
		404: "Reconciliation log not found",
	},
});
