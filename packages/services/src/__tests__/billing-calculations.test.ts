import { describe, it, expect } from "bun:test";
import { billingCalculations } from "../mutations/billing-mutations";

describe("billingCalculations", () => {
    describe("calculateCaptureCharge", () => {
        it("calculates charge for retail customers correctly", () => {
            const charge = billingCalculations.calculateCaptureCharge(
                1000, // captures
                10000 // KES 10,000 per 1000 captures
            );
            expect(charge).toBe(10000); // 1000/1000 * 10000
        });

        it("returns 0 for zero captures", () => {
            const charge = billingCalculations.calculateCaptureCharge(0, 10000);
            expect(charge).toBe(0);
        });
    });

    describe("calculateProfitShareCharge", () => {
        it("calculates 5% profit share correctly", () => {
            const charge = billingCalculations.calculateProfitShareCharge(
                350000, // KES 350,000 profit
                5       // 5%
            );
            expect(charge).toBe(17500); // 350000 * 0.05
        });

        it("returns 0 for zero profit", () => {
            const charge = billingCalculations.calculateProfitShareCharge(0, 5);
            expect(charge).toBe(0);
        });

        it("returns 0 for negative profit (no share on losses)", () => {
            const charge = billingCalculations.calculateProfitShareCharge(-10000, 5);
            expect(charge).toBe(0);
        });
    });

    describe("calculateTotalCharge", () => {
        it("sums all charges correctly", () => {
            const total = billingCalculations.calculateTotalCharge(
                5000,  // base
                1000,  // captures
                17500  // profit share
            );
            expect(total).toBe(23500);
        });

        it("handles zero outcome charges", () => {
            const total = billingCalculations.calculateTotalCharge(
                5000, // base only
                0,
                0
            );
            expect(total).toBe(5000);
        });
    });

    describe("generateInvoiceNumber", () => {
        it("generates invoice number with correct format", () => {
            const periodStart = new Date("2024-11-01");
            const invoiceNumber = billingCalculations.generateInvoiceNumber(periodStart);

            expect(invoiceNumber).toMatch(/^INV-202411-[A-Z0-9]{5}$/);
        });

        it("generates unique invoice numbers", () => {
            const periodStart = new Date("2024-11-01");
            const num1 = billingCalculations.generateInvoiceNumber(periodStart);
            const num2 = billingCalculations.generateInvoiceNumber(periodStart);

            expect(num1).not.toBe(num2);
        });
    });
});
