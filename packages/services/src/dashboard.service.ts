import db, {
	and,
	campaigns,
	count,
	customers,
	eq,
	promoCodes,
	sql,
	sum,
	withDrizzleErrors,
} from "@repo/db";
import { OrganizationContext } from "@repo/utils";
import type { DatabaseError } from "@repo/utils/errors/domain";
import { Effect } from "effect";

export const dashboardService = {
	getOverviewEffect(): Effect.Effect<
		{
			totalCampaigns: number;
			activeCampaigns: number;
			totalProfit: number;
			totalRevenue: number;
			totalRedemptions: number;
			profitableRedemptions: number;
			totalCustomers: number;
			verifiedCustomers: number;
			optedInCustomers: number;
			lifetimeValue: number;
		},
		DatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			const campaignStatsRows = yield* withDrizzleErrors(
				"campaign",
				"findMany",
				() =>
					db
						.select({
							totalCampaigns: count(),
							activeCampaigns: count(
								sql`CASE WHEN ${campaigns.status} = 'active' THEN 1 END`,
							),
						})
						.from(campaigns)
						.where(eq(campaigns.organizationId, organizationId)),
			);

			const campaignStats = campaignStatsRows[0];

			// Get profit/revenue from redeemed promo codes
			const promoStatsRows = yield* withDrizzleErrors(
				"promo_code",
				"findMany",
				() =>
					db
						.select({
							totalProfit: sum(promoCodes.actualProfit),
							totalRevenue: sum(promoCodes.netRevenue),
							totalRedemptions: count(
								sql`CASE WHEN ${promoCodes.isRedeemed} THEN 1 END`,
							),
							profitableRedemptions: count(
								sql`CASE WHEN ${promoCodes.isProfitable} THEN 1 END`,
							),
						})
						.from(promoCodes)
						.where(
							and(
								eq(promoCodes.organizationId, organizationId),
								eq(promoCodes.isRedeemed, true),
							),
						),
			);

			const promoStats = promoStatsRows[0];

			const customerStatsRows = yield* withDrizzleErrors(
				"customer",
				"findMany",
				() =>
					db
						.select({
							totalCustomers: count(),
							verifiedCustomers: count(
								sql`CASE WHEN ${customers.isAgeVerified} THEN 1 END`,
							),
							optedInCustomers: count(
								sql`CASE WHEN ${customers.hasOptedIn} THEN 1 END`,
							),
							totalLifetimeValue: sum(customers.attributedRevenue),
						})
						.from(customers)
						.where(eq(customers.organizationId, organizationId)),
			);

			const customerStats = customerStatsRows[0];

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
		});
	},
};
