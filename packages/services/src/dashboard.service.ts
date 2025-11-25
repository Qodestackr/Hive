/**
 * Dashboard Service
 * 
 * High-level overview metrics for distributor dashboard.
 * Aggregates across campaigns, promoCodes, and customers.
 */

import db, {
    withDbOperation,
    campaigns,
    promoCodes,
    customers,
    eq, and, sql, count, sum
} from "@repo/db";

export const dashboardService = {
    /**
     * Get dashboard overview
     * 
     * Provides high-level metrics for the distributor:
     * - Campaign counts (total, active)
     * - Profit and revenue totals
     * - Customer counts (total, verified)
     * - Lifetime value
     * 
     * @param organizationId - Organization context
     * @returns Dashboard overview
     */
    async getOverview(organizationId: string) {
        // Get campaign stats
        const campaignStats = await withDbOperation({
            operation: "findMany",
            table: "campaign",
            context: { organizationId }
        }, () => db
            .select({
                totalCampaigns: count(),
                activeCampaigns: count(sql`CASE WHEN ${campaigns.status} = 'active' THEN 1 END`),
            })
            .from(campaigns)
            .where(eq(campaigns.organizationId, organizationId))
            .then(rows => rows[0])
        );

        // Get profit/revenue from redeemed promo codes
        const promoStats = await withDbOperation({
            operation: "findMany",
            table: "promo_code",
            context: { organizationId }
        }, () => db
            .select({
                totalProfit: sum(promoCodes.actualProfit),
                totalRevenue: sum(promoCodes.netRevenue),
                totalRedemptions: count(sql`CASE WHEN ${promoCodes.isRedeemed} THEN 1 END`),
                profitableRedemptions: count(sql`CASE WHEN ${promoCodes.isProfitable} THEN 1 END`),
            })
            .from(promoCodes)
            .where(and(
                eq(promoCodes.organizationId, organizationId),
                eq(promoCodes.isRedeemed, true)
            ))
            .then(rows => rows[0])
        );

        // Get customer stats
        const customerStats = await withDbOperation({
            operation: "findMany",
            table: "customer",
            context: { organizationId }
        }, () => db
            .select({
                totalCustomers: count(),
                verifiedCustomers: count(sql`CASE WHEN ${customers.isAgeVerified} THEN 1 END`),
                optedInCustomers: count(sql`CASE WHEN ${customers.hasOptedIn} THEN 1 END`),
                totalLifetimeValue: sum(customers.attributedRevenue),
            })
            .from(customers)
            .where(eq(customers.organizationId, organizationId))
            .then(rows => rows[0])
        );

        return {
            // Campaign metrics
            totalCampaigns: campaignStats?.totalCampaigns || 0,
            activeCampaigns: campaignStats?.activeCampaigns || 0,

            // Financial metrics
            totalProfit: Number(promoStats?.totalProfit || 0),
            totalRevenue: Number(promoStats?.totalRevenue || 0),
            totalRedemptions: promoStats?.totalRedemptions || 0,
            profitableRedemptions: promoStats?.profitableRedemptions || 0,

            // Customer metrics
            totalCustomers: customerStats?.totalCustomers || 0,
            verifiedCustomers: customerStats?.verifiedCustomers || 0,
            optedInCustomers: customerStats?.optedInCustomers || 0,
            lifetimeValue: Number(customerStats?.totalLifetimeValue || 0),
        };
    },
};
