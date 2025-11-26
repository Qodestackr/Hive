import type { Invoice, OutcomeSnapshot } from "@repo/db";
import { createId } from "@paralleldrive/cuid2";

export const billingCalculations = {
    calculateCaptureCharge(
        capturesCount: number,
        outcomeBasePer1000Captures: number
    ): number {
        return (capturesCount / 1000) * outcomeBasePer1000Captures;
    },

    calculateProfitShareCharge(
        profitGenerated: number,
        outcomeProfitSharePercent: number
    ): number {
        if (profitGenerated <= 0) return 0;
        return profitGenerated * (outcomeProfitSharePercent / 100);
    },

    calculateTotalCharge(
        baseCharge: number,
        captureCharge: number,
        profitShareCharge: number
    ): number {
        return baseCharge + captureCharge + profitShareCharge;
    },

    generateInvoiceNumber(periodStart: Date): string {
        const year = periodStart.getFullYear();
        const month = String(periodStart.getMonth() + 1).padStart(2, '0');
        const random = Math.random().toString(36).substring(2, 7).toUpperCase();
        return `INV-${year}${month}-${random}`;
    },
};

// build invoice data from metrics
export function buildInvoiceMutation(params: {
    organizationId: string;
    periodStart: Date;
    periodEnd: Date;
    capturesCount: number;
    profitGenerated: number;
    pricingSnapshot: {
        pricingVersion: string;
        basePrice: number;
        outcomeBasePer1000Captures: number;
        outcomeProfitSharePercent: number;
    };
    campaignBreakdown: Array<{
        campaignId: string;
        name: string;
        captures: number;
        conversions: number;
        revenue: number;
        discountCost: number;
        profit: number;
    }>;
}): {
    invoice: Omit<Invoice, "createdAt" | "updatedAt">;
    outcomeSnapshot: Omit<OutcomeSnapshot, "id" | "createdAt">;
} {
    const {
        organizationId,
        periodStart,
        periodEnd,
        capturesCount,
        profitGenerated,
        pricingSnapshot,
        campaignBreakdown,
    } = params;

    // Calculate charges
    const baseCharge = pricingSnapshot.basePrice;
    const captureCharge = billingCalculations.calculateCaptureCharge(
        capturesCount,
        pricingSnapshot.outcomeBasePer1000Captures
    );
    const profitShareCharge = billingCalculations.calculateProfitShareCharge(
        profitGenerated,
        pricingSnapshot.outcomeProfitSharePercent
    );
    const totalAmount = billingCalculations.calculateTotalCharge(
        baseCharge,
        captureCharge,
        profitShareCharge
    );

    // Generate invoice
    const invoiceId = createId();
    const invoiceNumber = billingCalculations.generateInvoiceNumber(periodStart);
    const dueDate = new Date(periodEnd);
    dueDate.setDate(dueDate.getDate() + 30); // Due 30 days after period end

    const invoice: Omit<Invoice, "createdAt" | "updatedAt"> = {
        id: invoiceId,
        organizationId,
        number: invoiceNumber,
        periodStart,
        periodEnd,
        baseCharge,
        outcomeCharge: captureCharge + profitShareCharge,
        additionalUserCharge: 0,
        totalAmount,
        tax: 0,
        status: 'draft',
        dueDate,
        paidAt: null,
        metadata: {
            capturesCount,
            profitGenerated,
        },
    };

    // Build outcome snapshot
    const outcomeSnapshot: Omit<OutcomeSnapshot, "id" | "createdAt"> = {
        organizationId,
        invoiceId,
        periodStart,
        periodEnd,
        capturesCount,
        conversions: campaignBreakdown.reduce((sum, c) => sum + c.conversions, 0),
        revenue: campaignBreakdown.reduce((sum, c) => sum + c.revenue, 0),
        discountCost: campaignBreakdown.reduce((sum, c) => sum + c.discountCost, 0),
        profit: profitGenerated,
        campaignBreakdown,
        pricingSnapshot,
    };

    return { invoice, outcomeSnapshot };
}
