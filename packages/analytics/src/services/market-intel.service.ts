import db, { sql, supplierMarketIntel, withDrizzleErrors, and, eq, gte, lte } from "@repo/db";
import { Effect } from "effect";
import { OrganizationContext } from "@repo/utils";
import { MarketIntelCalculator } from "../calculators/market-intel-calculator.js";

interface RawQueryResult<T = any> {
    rows: T[];
}

export const marketIntelService = {
    generateIntelForPeriodEffect(
        brandId: string,
        region: string,
        periodStart: Date,
        periodEnd: Date,
    ) {
        return Effect.gen(function* () {
            const brandRedemptions = yield* withDrizzleErrors(
                "promoCodes",
                "marketIntel",
                () =>
                    (db as any).execute(sql`
          SELECT 
            pc."productId",
            COUNT(pc.id)::int as redemption_count,
            SUM(pc."netRevenue")::float as revenue,
            SUM(pc."discountValue")::float as discount_cost,
            SUM(pc."actualProfit")::float as profit,
            o.location
          FROM "promoCodes" pc
          JOIN products p ON p.id = pc."productId"
          JOIN organizations o ON o.id = pc."organizationId"
          WHERE p."saleorProductId" IN (
            SELECT "saleorProductId" FROM products 
            WHERE "organizationId" = o.id
          )
          AND pc."isRedeemed" = true
          AND pc."redeemedAt" >= ${periodStart}
          AND pc."redeemedAt" <= ${periodEnd}
          AND o.location = ${region}
          GROUP BY pc."productId", o.location
        `) as Promise<RawQueryResult>,
            );

            const intel = MarketIntelCalculator.calculate({
                brandRedemptions: brandRedemptions.rows,
                competitorRedemptions: new Map(),
                periodStart,
                periodEnd,
            });

            const mutation = {
                brandId,
                region,
                periodStart,
                periodEnd,
                totalVolume: intel.totalVolume,
                totalRevenue: intel.totalRevenue,
                avgMargin: intel.avgMargin,
                marketPosition: intel.marketPosition,
                trendDirection: intel.trendDirection,
                competitorComparison: intel.competitorComparison,
                geoBreakdown: intel.geoBreakdown,
            };

            return yield* withDrizzleErrors("supplierMarketIntel", "marketIntel", () =>
                db.insert(supplierMarketIntel).values(mutation).returning(),
            );
        });
    },

    getIntelEffect(
        brandId: string,
        region: string,
        startDate: Date,
        endDate: Date,
    ) {
        return Effect.gen(function* () {
            const { organizationId } = yield* OrganizationContext;

            return yield* withDrizzleErrors("supplierMarketIntel", "marketIntel", () =>
                db
                    .select()
                    .from(supplierMarketIntel)
                    .where(
                        and(
                            eq(supplierMarketIntel.brandId, brandId),
                            eq(supplierMarketIntel.region, region),
                            gte(supplierMarketIntel.periodStart, startDate),
                            lte(supplierMarketIntel.periodEnd, endDate),
                        ),
                    ),
            );
        });
    },
};
