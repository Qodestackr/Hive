import { OutcomeInvoiceSchema } from "@repo/schema";
import { billingService } from "@repo/services/src/billing.service";
import { z } from "@repo/schema";
import { Effect } from "effect";
import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";

export const GET = createWorkspaceRouteEffect({
	inputSchema: z.void(),
	outputSchema: OutcomeInvoiceSchema,

	handler: (_, { params }) => {
		const invoiceId = params.id!;

		return billingService.getInvoiceEffect(invoiceId).pipe(
			Effect.map((invoice) => ({
				id: invoice.id,
				invoiceNumber: invoice.number,
				periodStart: invoice.periodStart.toISOString(),
				periodEnd: invoice.periodEnd.toISOString(),
				baseCharge: invoice.baseCharge,
				captureCharge:
					(invoice.outcomeCharge || 0) -
					((invoice.metadata as any)?.profitGenerated || 0) * 0.05,
				profitShareCharge:
					((invoice.metadata as any)?.profitGenerated || 0) * 0.05,
				totalAmount: invoice.totalAmount,
				tax: invoice.tax || 0,
				amountDue: invoice.totalAmount + (invoice.tax || 0),
				capturesCount: (invoice.metadata as any)?.capturesCount || 0,
				profitGenerated: (invoice.metadata as any)?.profitGenerated || 0,
				campaignBreakdown: [],
				pricingSnapshot: {
					pricingVersion: "v1",
					basePrice: 5000,
					outcomeBasePer1000Captures: 10000,
					outcomeProfitSharePercent: 5,
				},
				status: invoice.status as "draft" | "open" | "paid" | "void",
				dueDate: invoice.dueDate.toISOString(),
				createdAt: invoice.createdAt.toISOString(),
			})),
		);
	},

	options: {
		operationName: "getInvoice",
		requiredPermissions: ["billing.view"],
		errorContext: {
			feature: "outcome-billing",
			action: "get-invoice",
		},
	},
});
