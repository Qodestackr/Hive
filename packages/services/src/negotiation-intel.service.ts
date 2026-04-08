import db, { promoCodes, products, sql, withDrizzleErrors } from "@repo/db";
import { Effect } from "effect";
import { OrganizationContext, type DatabaseError } from "@repo/utils";
import { NegotiationIntelTool } from "@repo/ai/tools/negotiation-intel.tool";

interface RawQueryResult<T = any> {
    rows: T[];
}

export const negotiationIntelService = {
    getDistributorPerformanceEffect(
        productId: string,
        periodDays: number = 90,
    ): Effect.Effect<
        {
            performance: {
                volume: number;
                revenue: number;
                redemptionRate: number;
                nationalPercentile: number;
                periodDays: number;
            };
            productName: string;
            currentSupplierPrice: number;
        },
        DatabaseError,
        OrganizationContext
    > {
        return Effect.gen(function* () {
            const { organizationId } = yield* OrganizationContext;

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - periodDays);

            const performance = yield* withDrizzleErrors(
                "promoCodes",
                "negotiationIntel",
                () =>
                    (db as any).execute(sql`
SELECT
COUNT(pc.id):: int as volume,
    SUM(pc."netRevenue"):: float as revenue,
        COUNT(pc.id) FILTER(WHERE pc."isRedeemed" = true):: int as redeemed_count,
            COUNT(pc.id):: int as total_codes
            FROM "promoCodes" pc
            WHERE pc."productId" = ${productId}
              AND pc."organizationId" = ${organizationId}
              AND pc."createdAt" >= ${cutoffDate}
`) as Promise<RawQueryResult>,
            );

            const nationalAvg = yield* withDrizzleErrors(
                "promoCodes",
                "negotiationIntel",
                () =>
                    (db as any).execute(sql`
SELECT
AVG(redemption_rate):: float as avg_redemption_rate
FROM(
    SELECT 
                pc."organizationId",
    COUNT(pc.id) FILTER(WHERE pc."isRedeemed" = true):: float /
    NULLIF(COUNT(pc.id):: float, 0) * 100 as redemption_rate
              FROM "promoCodes" pc
              WHERE pc."productId" = ${productId}
                AND pc."createdAt" >= ${cutoffDate}
              GROUP BY pc."organizationId"
) org_performance
          `) as Promise<RawQueryResult>,
            );

            const productData = yield* withDrizzleErrors(
                "products",
                "negotiationIntel",
                () =>
                    db
                        .select({ name: products.name, basePrice: products.basePrice })
                        .from(products)
                        .where(sql`${products.id} = ${productId} `)
                        .limit(1),
            );

            const row = performance.rows[0];
            const redemptionRate =
                row.total_codes > 0 ? (row.redeemed_count / row.total_codes) * 100 : 0;
            const nationalRedemptionRate = nationalAvg.rows[0]?.avg_redemption_rate || 20;

            let nationalPercentile = 50;
            if (redemptionRate >= nationalRedemptionRate * 1.5) {
                nationalPercentile = 5;
            } else if (redemptionRate >= nationalRedemptionRate * 1.3) {
                nationalPercentile = 10;
            } else if (redemptionRate >= nationalRedemptionRate * 1.1) {
                nationalPercentile = 25;
            }

            return {
                performance: {
                    volume: row.volume,
                    revenue: row.revenue,
                    redemptionRate: Math.round(redemptionRate * 10) / 10,
                    nationalPercentile,
                    periodDays,
                },
                productName: productData[0]?.name || "Unknown Product",
                currentSupplierPrice: productData[0]?.basePrice || 0,
            };
        });
    },

    generateNegotiationIntelEffect(productId: string): Effect.Effect<
        {
            performance: {
                volume: number;
                revenue: number;
                redemptionRate: number;
                nationalPercentile: number;
                periodDays: number;
            };
            currentSupplierPrice: number;
            suggestedNegotiation: {
                targetPrice: number;
                discountPercentage: number;
                reasoning: string;
            };
            fallbackPosition: string;
            negotiationScript: string;
        },
        DatabaseError | Error,
        OrganizationContext
    > {
        return Effect.gen(function* () {
            const perfData = yield* this.getDistributorPerformanceEffect(productId);

            const aiResult = yield* NegotiationIntelTool.runEffect({
                volume: perfData.performance.volume,
                revenue: perfData.performance.revenue,
                redemptionRate: perfData.performance.redemptionRate,
                nationalPercentile: perfData.performance.nationalPercentile,
                productName: perfData.productName,
                currentPrice: perfData.currentSupplierPrice,
            });

            const targetPrice =
                perfData.currentSupplierPrice * (1 - aiResult.targetDiscount / 100);

            return {
                performance: perfData.performance,
                currentSupplierPrice: perfData.currentSupplierPrice,
                suggestedNegotiation: {
                    targetPrice: Math.round(targetPrice),
                    discountPercentage: aiResult.targetDiscount,
                    reasoning: aiResult.reasoning,
                },
                fallbackPosition: aiResult.fallbackPosition,
                negotiationScript: aiResult.negotiationScript,
            };
        });
    },
};
