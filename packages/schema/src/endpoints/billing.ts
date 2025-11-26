import { z } from "zod";
import {
	OutcomeInvoiceGenerateSchema,
	OutcomeInvoiceListQuerySchema,
	OutcomeInvoiceListResponseSchema,
	OutcomeInvoiceSchema,
} from "../billing/billing.schema.js";
import { registerRoute } from "../utils/route-builder.js";

// Generate invoice
registerRoute({
	method: "post",
	path: "/api/v1/billing/invoices/generate",
	summary: "Generate outcome-based invoice",
	description:
		"Generate invoice based on actual value delivered (profit tracked via FIFO).",
	tags: ["Billing"],
	body: OutcomeInvoiceGenerateSchema,
	response: OutcomeInvoiceSchema,
	errors: {
		400: "Invalid date range",
	},
});

// Get invoice by ID
registerRoute({
	method: "get",
	path: "/api/v1/billing/invoices/{id}",
	summary: "Get invoice by ID",
	description: "Get full invoice details.",
	tags: ["Billing"],
	params: z.object({
		id: z
			.string()
			.openapi({ param: { name: "id", in: "path" }, example: "inv_123" }),
	}),
	response: OutcomeInvoiceSchema,
	errors: {
		404: "Invoice not found",
	},
});

// List invoices
registerRoute({
	method: "get",
	path: "/api/v1/billing/invoices",
	summary: "List invoices",
	description: "Get paginated list of outcome-based invoices.",
	tags: ["Billing"],
	query: OutcomeInvoiceListQuerySchema,
	response: OutcomeInvoiceListResponseSchema,
	errors: {
		400: "Invalid query parameters",
	},
});
