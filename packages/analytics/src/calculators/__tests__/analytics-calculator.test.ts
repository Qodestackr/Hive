import { describe, expect, test } from "bun:test";
import { AnalyticsCalculator } from "../analytics-calculator";

/**
 * Pure Function Tests
 *
 * No mocks, no DB, just math.
 * Deterministic = reliable = AI-friendly.
 */

describe("AnalyticsCalculator", () => {
    // ============================================================================
    // Velocity Score
    // ============================================================================

    describe("calculateVelocityScore", () => {
        test("returns 0 for zero stock", () => {
            const score = AnalyticsCalculator.calculateVelocityScore(10, 0);
            expect(score).toBe(0);
        });

        test("calculates correct velocity for slow movers", () => {
            const score = AnalyticsCalculator.calculateVelocityScore(5, 100);
            // 5 units sold / 100 stock = 5% turnover = 5 velocity score
            expect(score).toBe(5);
        });

        test("caps velocity score at 100", () => {
            const score = AnalyticsCalculator.calculateVelocityScore(200, 50);
            // 200/50 = 400% turnover, capped at 100
            expect(score).toBe(100);
        });

        test("rounds velocity score to nearest integer", () => {
            const score = AnalyticsCalculator.calculateVelocityScore(33, 100);
            // 33/100 = 33% turnover = 33 velocity score
            expect(score).toBe(33);
        });
    });

    // ============================================================================
    // Safe Discount Calculation
    // ============================================================================

    describe("calculateSafeDiscount", () => {
        test("returns 0 if margin already below target", () => {
            const discount = AnalyticsCalculator.calculateSafeDiscount({
                marginPct: 8,
                velocityScore: 50,
                targetMarginPct: 10,
            });
            expect(discount).toBe(0);
        });

        test("suggests higher discount for fast movers", () => {
            const slowMoverDiscount = AnalyticsCalculator.calculateSafeDiscount({
                marginPct: 40,
                velocityScore: 20, // Slow mover
                targetMarginPct: 10,
            });

            const fastMoverDiscount = AnalyticsCalculator.calculateSafeDiscount({
                marginPct: 40,
                velocityScore: 80, // Fast mover
                targetMarginPct: 10,
            });

            expect(fastMoverDiscount).toBeGreaterThan(slowMoverDiscount);
        });

        test("respects target margin", () => {
            const discount = AnalyticsCalculator.calculateSafeDiscount({
                marginPct: 40,
                velocityScore: 50,
                targetMarginPct: 10,
            });

            // With 40% margin, target 10%, headroom = 30%
            // Base discount = 70% of headroom = 21%
            // Velocity multiplier adds ~10% more = ~23%
            expect(discount).toBeGreaterThan(20);
            expect(discount).toBeLessThan(25);
        });

        test("returns integer discount percentage", () => {
            const discount = AnalyticsCalculator.calculateSafeDiscount({
                marginPct: 35.7,
                velocityScore: 42.3,
                targetMarginPct: 10,
            });

            expect(Number.isInteger(discount)).toBe(true);
        });
    });

    // ============================================================================
    // Customer LTV
    // ============================================================================

    describe("calculateCustomerLTV", () => {
        test("returns zeros for no redemptions", () => {
            const ltv = AnalyticsCalculator.calculateCustomerLTV([]);

            expect(ltv.totalLifetimeProfit).toBe(0);
            expect(ltv.avgProfitPerRedemption).toBe(0);
            expect(ltv.daysSinceFirstRedemption).toBe(0);
            expect(ltv.projectedAnnualValue).toBe(0);
        });

        test("calculates LTV correctly", () => {
            const ltv = AnalyticsCalculator.calculateCustomerLTV([
                { profit: 500, date: new Date("2025-01-01") },
                { profit: 300, date: new Date("2025-02-15") },
                { profit: 700, date: new Date("2025-03-10") },
            ]);

            expect(ltv.totalLifetimeProfit).toBe(1500);
            expect(ltv.avgProfitPerRedemption).toBe(500);
            expect(ltv.daysSinceFirstRedemption).toBeGreaterThan(0);
            expect(ltv.projectedAnnualValue).toBeGreaterThan(0);
        });

        test("projects annual value based on run rate", () => {
            const today = new Date();
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(today.getDate() - 30);

            const ltv = AnalyticsCalculator.calculateCustomerLTV([
                { profit: 1000, date: thirtyDaysAgo },
                { profit: 500, date: today },
            ]);

            // 1500 profit over ~30 days = ~50/day = ~18,250/year
            expect(ltv.projectedAnnualValue).toBeGreaterThan(15000);
            expect(ltv.projectedAnnualValue).toBeLessThan(20000);
        });

        test("uses earliest redemption for day calculation", () => {
            const ltv = AnalyticsCalculator.calculateCustomerLTV([
                { profit: 500, date: new Date("2025-03-01") },
                { profit: 300, date: new Date("2025-01-01") }, // Earlier
                { profit: 700, date: new Date("2025-02-01") },
            ]);

            // Should use Jan 1 as start date
            expect(ltv.daysSinceFirstRedemption).toBeGreaterThan(50);
        });
    });

    // ============================================================================
    // Margin Health Classification
    // ============================================================================

    describe("classifyMarginHealth", () => {
        test("returns LOSING_MONEY for negative profit", () => {
            const status = AnalyticsCalculator.classifyMarginHealth(-100, 50);
            expect(status).toBe("🚨 LOSING_MONEY");
        });

        test("returns LOW_MARGIN for profit < 100 per redemption", () => {
            const status = AnalyticsCalculator.classifyMarginHealth(500, 50);
            expect(status).toBe("⚠️ LOW_MARGIN");
        });

        test("returns HEALTHY for good margins", () => {
            const status = AnalyticsCalculator.classifyMarginHealth(5000, 150);
            expect(status).toBe("✅ HEALTHY");
        });

        test("edge case: exactly 100 avg profit", () => {
            const status = AnalyticsCalculator.classifyMarginHealth(1000, 100);
            expect(status).toBe("✅ HEALTHY");
        });
    });

    // ============================================================================
    // Capture Fee ROI
    // ============================================================================

    describe("calculateCaptureFeeROI", () => {
        test("returns 0 for zero customers", () => {
            const roi = AnalyticsCalculator.calculateCaptureFeeROI(1000, 0, 10);
            expect(roi).toBe(0);
        });

        test("returns 0 for zero capture fee", () => {
            const roi = AnalyticsCalculator.calculateCaptureFeeROI(1000, 10, 0);
            expect(roi).toBe(0);
        });

        test("calculates ROI correctly", () => {
            const roi = AnalyticsCalculator.calculateCaptureFeeROI(2400, 10, 10);
            // Charged: 10 customers × KES 10 = KES 100
            // Generated: KES 2400
            // ROI: 2400 / 100 = 24x
            expect(roi).toBe(24);
        });

        test("uses default capture fee of KES 10", () => {
            const roi = AnalyticsCalculator.calculateCaptureFeeROI(500, 10);
            // Charged: 10 × 10 = 100
            // Generated: 500
            // ROI: 5x
            expect(roi).toBe(5);
        });

        test("rounds to 2 decimal places", () => {
            const roi = AnalyticsCalculator.calculateCaptureFeeROI(123, 7, 10);
            // 123 / 70 = 1.757... → 1.76
            expect(roi).toBe(1.76);
        });

        test("handles high ROI scenarios", () => {
            const roi = AnalyticsCalculator.calculateCaptureFeeROI(35000, 50, 10);
            // 35000 / 500 = 70x ROI
            expect(roi).toBe(70);
        });
    });
});
