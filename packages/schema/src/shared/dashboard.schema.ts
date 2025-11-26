import { z } from "zod";

// ============================================================================
// DASHBOARD SCHEMAS
// ============================================================================

/**
 * Dashboard overview schema
 * High-level metrics for distributor dashboard
 */
export const DashboardOverviewSchema = z
	.object({
		// Campaign metrics
		totalCampaigns: z.number().int().nonnegative(),
		activeCampaigns: z.number().int().nonnegative(),

		// Financial metrics
		totalProfit: z.number(),
		totalRevenue: z.number().nonnegative(),
		totalRedemptions: z.number().int().nonnegative(),
		profitableRedemptions: z.number().int().nonnegative(),

		// Customer metrics
		totalCustomers: z.number().int().nonnegative(),
		verifiedCustomers: z.number().int().nonnegative(),
		optedInCustomers: z.number().int().nonnegative(),
		lifetimeValue: z.number().nonnegative(),
	})
	.openapi("DashboardOverview");

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type DashboardOverview = z.infer<typeof DashboardOverviewSchema>;
