/**
 * Calculate inventory velocity score
 * 
 * Velocity = how fast inventory turns over
 * Higher score = faster moving product
 * 
 * @param unitsSold30d - Units sold in last 30 days
 * @param currentStock - Current stock quantity
 * @returns Velocity score (0-100, higher = faster moving)
 * 
 * @example
 * AnalyticsCalculator.calculateVelocityScore(5, 100) // 5 (slow mover)
 * AnalyticsCalculator.calculateVelocityScore(80, 50) // 100 (fast mover, capped)
 */
export class AnalyticsCalculator {
    static calculateVelocityScore(
        unitsSold30d: number,
        currentStock: number,
    ): number {
        if (currentStock === 0) return 0;
        const turnoverRatio = unitsSold30d / currentStock;
        return Math.min(100, Math.round(turnoverRatio * 100));
    }

    /**
     * Calculate recommended discount percentage
     * 
     * Based on margin % and inventory velocity.
     * Ensures profitability while clearing stock.
     * 
     * @param params - Margin and velocity inputs
     * @returns Safe discount percentage that maintains profitability
     * 
     * @example
     * AnalyticsCalculator.calculateSafeDiscount({
     *   marginPct: 40,
     *   velocityScore: 20, // Slow mover
     *   targetMarginPct: 10
     * }) // Returns ~23% (conservative)
     * 
     * AnalyticsCalculator.calculateSafeDiscount({
     *   marginPct: 40,
     *   velocityScore: 80, // Fast mover
     *   targetMarginPct: 10
     * }) // Returns ~27% (more aggressive)
     */
    static calculateSafeDiscount(params: {
        marginPct: number;
        velocityScore: number;
        targetMarginPct?: number;
    }): number {
        const { marginPct, velocityScore, targetMarginPct = 10 } = params;

        // Don't discount if margin already below target
        if (marginPct <= targetMarginPct) return 0;

        // Calculate available margin headroom
        const headroom = marginPct - targetMarginPct;

        // Adjust discount based on velocity (faster movers can handle deeper discounts)
        const velocityMultiplier = velocityScore / 100;

        // Base discount = 70% of headroom, boosted up to 30% more for fast movers
        const safeDiscount = headroom * 0.7 * (1 + velocityMultiplier * 0.3);

        return Math.floor(safeDiscount);
    }

    /**
     * Calculate customer lifetime value from redemptions
     * 
     * Pure calculation - no DB queries.
     * Proves capture fee ROI with receipts.
     * 
     * @param redemptions - Array of redemption profits and dates
     * @returns LTV metrics
     * 
     * @example
     * const ltv = AnalyticsCalculator.calculateCustomerLTV([
     *   { profit: 500, date: new Date('2025-01-01') },
     *   { profit: 300, date: new Date('2025-02-15') },
     *   { profit: 700, date: new Date('2025-03-10') }
     * ]);
     * // ltv.totalLifetimeProfit = 1500
     * // ltv.projectedAnnualValue = ~6575 (based on run rate)
     */
    static calculateCustomerLTV(
        redemptions: Array<{ profit: number; date: Date }>,
    ): {
        totalLifetimeProfit: number;
        avgProfitPerRedemption: number;
        daysSinceFirstRedemption: number;
        projectedAnnualValue: number;
    } {
        if (redemptions.length === 0) {
            return {
                totalLifetimeProfit: 0,
                avgProfitPerRedemption: 0,
                daysSinceFirstRedemption: 0,
                projectedAnnualValue: 0,
            };
        }

        const totalLifetimeProfit = redemptions.reduce(
            (sum, r) => sum + r.profit,
            0,
        );
        const avgProfitPerRedemption = totalLifetimeProfit / redemptions.length;

        const firstRedemption = redemptions.reduce(
            (earliest, r) => (r.date < earliest ? r.date : earliest),
            redemptions[0]!.date,
        );

        const daysSinceFirstRedemption = Math.max(
            1,
            Math.floor((Date.now() - firstRedemption.getTime()) / (1000 * 60 * 60 * 24)),
        );

        // Project annual value based on current run rate
        const dailyValue = totalLifetimeProfit / daysSinceFirstRedemption;
        const projectedAnnualValue = dailyValue * 365;

        return {
            totalLifetimeProfit,
            avgProfitPerRedemption,
            daysSinceFirstRedemption,
            projectedAnnualValue,
        };
    }
    /**
     * Classify margin health status
     * 
     * Pure business logic for health indicators.
     * 
     * @param profit - Total profit
     * @param avgProfitPerRedemption - Average profit per redemption
     * @returns Health status with emoji indicator
     */
    static classifyMarginHealth(
        profit: number,
        avgProfitPerRedemption: number,
    ): "🚨 LOSING_MONEY" | "⚠️ LOW_MARGIN" | "✅ HEALTHY" {
        if (profit < 0) return "🚨 LOSING_MONEY";
        if (avgProfitPerRedemption < 100) return "⚠️ LOW_MARGIN";
        return "✅ HEALTHY";
    }

    /**
     * Calculate capture fee ROI
     * 
     * Proves outcome-based pricing with receipts.
     * 
     * @param totalProfit - Total profit generated by captured customers
     * @param customerCount - Number of customers captured
     * @param captureFePerCustomer - Capture fee charged (default KES 10)
     * @returns ROI multiplier (24x = KES 240 profit per KES 10 fee)
     * 
     * @example
     * AnalyticsCalculator.calculateCaptureFeeROI(2400, 10, 10)
     * // Returns 24 (24x ROI - charged KES 100, generated KES 2400)
     */
    static calculateCaptureFeeROI(
        totalProfit: number,
        customerCount: number,
        captureFeePerCustomer: number = 10,
    ): number {
        if (customerCount === 0) return 0;
        const totalFeesCharged = customerCount * captureFeePerCustomer;
        if (totalFeesCharged === 0) return 0;
        return Math.round((totalProfit / totalFeesCharged) * 100) / 100;
    }
}
