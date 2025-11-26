import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";
import { OutcomeInvoiceGenerateSchema, OutcomeInvoiceSchema } from "@repo/schema";
import { billingService } from "@repo/services/src/billing.service";
import { Effect } from "effect";

export const POST = createWorkspaceRouteEffect({
    inputSchema: OutcomeInvoiceGenerateSchema,
    outputSchema: OutcomeInvoiceSchema,

    handler: (data) => {
        const { periodStart, periodEnd } = data as {
            periodStart: string;
            periodEnd: string;
        };

        return billingService
            .generateInvoiceEffect(
                new Date(periodStart),
                new Date(periodEnd)
            )
            .pipe(
                Effect.map((invoice) => ({
                    id: invoice.id,
                    invoiceNumber: invoice.number,
                    periodStart: invoice.periodStart.toISOString(),
                    periodEnd: invoice.periodEnd.toISOString(),
                    baseCharge: invoice.baseCharge,
                    captureCharge: (invoice.outcomeCharge || 0) - ((invoice.metadata as any)?.profitGenerated || 0) * 0.05,
                    profitShareCharge: ((invoice.metadata as any)?.profitGenerated || 0) * 0.05,
                    totalAmount: invoice.totalAmount,
                    tax: invoice.tax || 0,
                    amountDue: invoice.totalAmount + (invoice.tax || 0), // AMOUNT TO BE PAID
                    capturesCount: (invoice.metadata as any)?.capturesCount || 0,
                    profitGenerated: (invoice.metadata as any)?.profitGenerated || 0,
                    campaignBreakdown: [], //... TODO: From outcome snapshots
                    pricingSnapshot: {
                        pricingVersion: "v1",
                        basePrice: 5_000,
                        outcomeBasePer1000Captures: 10_000,
                        outcomeProfitSharePercent: 5,
                    },
                    status: invoice.status as "draft" | "open" | "paid" | "void",
                    dueDate: invoice.dueDate.toISOString(),
                    createdAt: invoice.createdAt.toISOString(),
                }))
            );
    },

    options: {
        operationName: "generateInvoice",
        requiredPermissions: ["billing.manage"],
        errorContext: {
            feature: "outcome-billing",
            action: "generate-invoice",
        },
    },
});
