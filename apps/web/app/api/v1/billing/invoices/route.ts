import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";
import {
    OutcomeInvoiceListQuerySchema,
    OutcomeInvoiceListResponseSchema,
} from "@repo/schema";
import { billingService } from "@repo/services/src/billing.service";
import { Effect } from "effect";

export const GET = createWorkspaceRouteEffect({
    inputSchema: OutcomeInvoiceListQuerySchema,
    outputSchema: OutcomeInvoiceListResponseSchema,

    handler: (query) => {
        const { page, limit, status } = query as {
            page: number;
            limit: number;
            status?: string;
        };

        return billingService
            .listInvoicesEffect({ page, limit, status })
            .pipe(
                Effect.map((result) => ({
                    data: result.data.map((invoice) => ({
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
                        campaignBreakdown: [],
                        pricingSnapshot: {
                            pricingVersion: "v1",
                            basePrice: 5_000,
                            outcomeBasePer1000Captures: 10_000,
                            outcomeProfitSharePercent: 5,
                        },
                        status: invoice.status as "draft" | "open" | "paid" | "void",
                        dueDate: invoice.dueDate.toISOString(),
                        createdAt: invoice.createdAt.toISOString(),
                    })),
                    pagination: result.pagination,
                }))
            );
    },

    options: {
        operationName: "listInvoices",
        requiredPermissions: ["billing.view"],
        errorContext: {
            feature: "outcome-billing",
            action: "list-invoices",
        },
    },
});
