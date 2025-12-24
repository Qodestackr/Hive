interface BrandRedemption {
    productId: string;
    redemptionCount: number;
    revenue: number;
    discountCost: number;
    profit: number;
    location: string;
}

export class MarketIntelCalculator {
    static calculate(input: {
        brandRedemptions: BrandRedemption[];
        competitorRedemptions: Map<string, BrandRedemption[]>;
        periodStart: Date;
        periodEnd: Date;
    }) {
        const totalVolume = this.calculateVolume(input.brandRedemptions);
        const totalRevenue = this.calculateRevenue(input.brandRedemptions);
        const avgMargin = this.calculateAvgMargin(input.brandRedemptions);

        const marketPosition = this.calculateMarketPosition(
            totalVolume,
            input.competitorRedemptions,
        );

        const trendDirection = this.calculateTrend(totalVolume);

        const competitorComparison = this.buildCompetitorComparison(
            totalVolume,
            avgMargin,
            input.competitorRedemptions,
        );

        const geoBreakdown = this.calculateGeoBreakdown(input.brandRedemptions);

        return {
            totalVolume,
            totalRevenue,
            avgMargin,
            marketPosition,
            trendDirection,
            competitorComparison,
            geoBreakdown,
        };
    }

    private static calculateVolume(redemptions: BrandRedemption[]): number {
        return redemptions.reduce((sum, r) => sum + r.redemptionCount, 0);
    }

    private static calculateRevenue(redemptions: BrandRedemption[]): number {
        return redemptions.reduce((sum, r) => sum + r.revenue, 0);
    }

    private static calculateAvgMargin(redemptions: BrandRedemption[]): number {
        if (redemptions.length === 0) return 0;

        const totalProfit = redemptions.reduce((sum, r) => sum + r.profit, 0);
        const totalRevenue = redemptions.reduce((sum, r) => sum + r.revenue, 0);

        return totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    }

    private static calculateMarketPosition(
        brandVolume: number,
        competitors: Map<string, BrandRedemption[]>,
    ): number {
        const volumes = Array.from(competitors.values())
            .map((redemptions) => this.calculateVolume(redemptions))
            .concat(brandVolume)
            .sort((a, b) => b - a);

        return volumes.indexOf(brandVolume) + 1;
    }

    private static calculateTrend(volume: number): "up" | "down" | "flat" {
        return "flat";
    }

    private static buildCompetitorComparison(
        brandVolume: number,
        brandMargin: number,
        competitors: Map<string, BrandRedemption[]>,
    ) {
        return Array.from(competitors.entries()).map(
            ([competitorBrandId, redemptions]) => {
                const compVolume = this.calculateVolume(redemptions);
                const compMargin = this.calculateAvgMargin(redemptions);

                return {
                    brandId: competitorBrandId,
                    brandName: "Unknown",
                    volumeDiff: ((brandVolume - compVolume) / compVolume) * 100,
                    marginDiff: brandMargin - compMargin,
                };
            },
        );
    }

    private static calculateGeoBreakdown(redemptions: BrandRedemption[]) {
        const locationCounts = redemptions.reduce(
            (acc, r) => {
                acc[r.location] = (acc[r.location] || 0) + r.redemptionCount;
                return acc;
            },
            {} as Record<string, number>,
        );

        const total = Object.values(locationCounts).reduce(
            (sum, count) => sum + count,
            0,
        );

        return Object.entries(locationCounts).map(([location, count]) => ({
            location,
            percentage: (count / total) * 100,
        }));
    }
}
