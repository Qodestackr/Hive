import { describe, it, expect } from "bun:test";
import { buildInvoiceMutation } from "../mutations/billing-mutations";

describe("buildInvoiceMutation", () => {
    const mockPricingSnapshot = {
        pricingVersion: "v1",
        basePrice: 5000,
        outcomeBasePer1000Captures: 10000,
        outcomeProfitSharePercent: 5,
    };

    const mockCampaignBreakdown = [
        {
            campaignId: "c1",
            name: "Campaign 1",
            captures: 100,
            conversions: 10,
            revenue: 10000,
            discountCost: 1000,
            profit: 5000,
        }
    ];

    it("uses provided pricing snapshot for calculations", () => {
        const result = buildInvoiceMutation({
            organizationId: "org1",
            periodStart: new Date("2024-11-01"),
            periodEnd: new Date("2024-11-30"),
            capturesCount: 1000,
            profitGenerated: 100000,
            pricingSnapshot: mockPricingSnapshot,
            campaignBreakdown: mockCampaignBreakdown,
        });

        // Base: 5000
        // Captures: (1000/1000) * 10000 = 10000
        // Profit Share: 100000 * 0.05 = 5000
        // Total: 20000
        expect(result.invoice.baseCharge).toBe(5000);
        expect(result.invoice.outcomeCharge).toBe(15000);
        expect(result.invoice.totalAmount).toBe(20000);
        expect(result.outcomeSnapshot.pricingSnapshot).toEqual(mockPricingSnapshot);
    });

    it("handles custom pricing models (e.g. higher profit share)", () => {
        const customPricing = {
            ...mockPricingSnapshot,
            outcomeProfitSharePercent: 10, // 10% share
        };

        const result = buildInvoiceMutation({
            organizationId: "org1",
            periodStart: new Date("2024-11-01"),
            periodEnd: new Date("2024-11-30"),
            capturesCount: 1000,
            profitGenerated: 100000,
            pricingSnapshot: customPricing,
            campaignBreakdown: mockCampaignBreakdown,
        });

        // Base: 5000
        // Captures: 10000
        // Profit Share: 100000 * 0.10 = 10000
        // Total: 25000
        expect(result.invoice.totalAmount).toBe(25000);
        expect(result.outcomeSnapshot.pricingSnapshot).toEqual(customPricing);
    });

    it("handles zero profit correctly", () => {
        const result = buildInvoiceMutation({
            organizationId: "org1",
            periodStart: new Date("2024-11-01"),
            periodEnd: new Date("2024-11-30"),
            capturesCount: 1000,
            profitGenerated: 0,
            pricingSnapshot: mockPricingSnapshot,
            campaignBreakdown: mockCampaignBreakdown,
        });

        // Base: 5000
        // Captures: 10000
        // Profit Share: 0
        // Total: 15000
        expect(result.invoice.totalAmount).toBe(15000);
    });
});
