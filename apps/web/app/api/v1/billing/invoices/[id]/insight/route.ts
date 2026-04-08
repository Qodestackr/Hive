import { z } from '@repo/schema';
import { billingService } from '@repo/services/src/billing.service';
import { Effect } from 'effect';
import { createWorkspaceRouteEffect } from '@/lib/api/create-api-route-effect';

const InsightResponseSchema = z.object({
    insight: z.string(),
});

// Cache + Pre-generate. ✅ One AI call per invoice
export const GET = createWorkspaceRouteEffect({
    inputSchema: z.object({
        params: z.object({
            id: z.string(),
        }),
    }),
    outputSchema: InsightResponseSchema,

    handler: ({ params }) => {
        const { id: invoiceId } = params;

        return Effect.gen(function* (_) {
            const { invoice, campaignBreakdown, totalProfit, capturesCount } = yield* _(
                billingService.getInvoiceWithCampaignBreakdownEffect(invoiceId),
            );

            const insight = yield* _(
                billingService.generateInvoiceInsightEffect(
                    invoice.periodStart,
                    invoice.periodEnd,
                    campaignBreakdown,
                    totalProfit,
                    capturesCount,
                ),
            );

            return { insight };
        });
    },

    options: {
        operationName: 'generateInvoiceInsight',
        requiredPermissions: ['billing.view'],
        errorContext: {
            feature: 'outcome-billing',
            action: 'generate-insight',
        },
    },
});
