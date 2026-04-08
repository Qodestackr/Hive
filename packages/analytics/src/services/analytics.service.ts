import db, { campaigns, promoCodes, sql, withDrizzleErrors } from "@repo/db";
import { Effect } from "effect";
import { DatabaseError, DatabaseQueryError, OrganizationContext } from "@repo/utils";
import type {
	CampaignHealthResponse,
	SlowMoversResponse,
	CaptureROIResponse,
	MarginErosionResponse,
	CategoryPerformanceResponse,
	CostTrendsResponse,
	ComplianceSummaryResponse,
} from "../types/analytics.types.js";
import { AnalyticsCalculator } from "../calculators/analytics-calculator.js";

// Helper type for raw SQL results
interface RawQueryResult<T = any> {
	rows: T[];
}

/**
 * Analytics Service (Drizzle ORM + Postgres)
 *
 * CURRENT IMPLEMENTATION: Uses existing @repo/db Drizzle setup
 * - Good for: <1M promo code redemptions, <100K products
 * - Query time: ~50-200ms for typical distributor datasets
 * - Leverages existing db client, same pattern as other services
 *
 * WHEN TO UPGRADE TO DUCKDB:
 * Switch to DuckDB ATTACH pattern when you hit:
 * - >10M rows in analytical queries
 * - >500ms query times on aggregations
 * - Need for PERCENTILE_CONT, complex window functions over massive datasets
 * - Multi-table scans with 100M+ joined rows
 *
 * DuckDB Hybrid Approach (for future scale):
 * ```typescript
 * import { Database } from 'duckdb-async';
 * const duckdb = await Database.create(':memory:');
 * await duckdb.exec(`
 *   INSTALL postgres; LOAD postgres;
 *   ATTACH '${process.env.DATABASE_URL}' AS neon (TYPE postgres);
 * `);
 * // Query via DuckDB's columnar engine (10-100x faster for OLAP)
 * const result = await duckdb.all(`SELECT ... FROM neon.campaigns ...`);
 * ```
 *
 * Pattern: Effect-based services consuming OrganizationContext
 * - No prop drilling - organizationId comes from context
 * - Errors are typed and handled via Effect
 * - Queries are deterministic (AI-friendly, no hallucinations)
 */
export const analyticsService = {
	/**
	 * Get real-time campaign profit health
	 *
	 * Business Question: "Is this campaign making or losing money RIGHT NOW?"
	 *
	 * This is prescriptive intelligence, not engagement theater.
	 * Proves outcome-based pricing with receipts.
	 *
	 * @returns Effect that succeeds with campaign health data or fails with DatabaseQueryError
	 */
	getCampaignHealthEffect(): Effect.Effect<
		CampaignHealthResponse,
		DatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			const campaigns = yield* withDrizzleErrors("campaigns", "analytics", () =>
				(db as any).execute(sql`
					SELECT 
						c.id,
						c.name,
						c.status,
						COUNT(pc.id)::int as redemptions,
						COALESCE(SUM(pc."actualProfit"), 0)::float as total_profit,
						COALESCE(AVG(pc."actualProfit"), 0)::float as avg_profit_per_redemption,
						CASE 
							WHEN SUM(pc."netRevenue") > 0 
							THEN (SUM(pc."actualProfit") / SUM(pc."netRevenue")) * 100 
							ELSE 0 
						END as profit_margin_pct
					FROM campaigns c
					LEFT JOIN "promoCodes" pc ON pc."campaignId" = c.id AND pc."isRedeemed" = true
					WHERE c."organizationId" = ${organizationId}
						AND c.status = 'active'
					GROUP BY c.id, c.name, c.status
					ORDER BY total_profit ASC
				`) as Promise<RawQueryResult>
			);

			// Use pure calculator for health classification
			const campaignsWithHealth = campaigns.rows.map((c: any) => ({
				id: c.id,
				name: c.name,
				status: c.status,
				redemptions: c.redemptions,
				totalProfit: c.total_profit,
				avgProfitPerRedemption: c.avg_profit_per_redemption,
				profitMarginPct: c.profit_margin_pct,
				healthStatus: AnalyticsCalculator.classifyMarginHealth(
					c.total_profit,
					c.avg_profit_per_redemption,
				),
			}));

			const summary = {
				totalCampaigns: campaignsWithHealth.length,
				losingMoney: campaignsWithHealth.filter(
					(c) => c.healthStatus === "🚨 LOSING_MONEY",
				).length,
				totalProfit: campaignsWithHealth.reduce(
					(sum, c) => sum + c.totalProfit,
					0,
				),
			};

			return { campaigns: campaignsWithHealth, summary };
		});
	},

	/**
	 * Get slow-moving inventory with profit context
	 *
	 * Business Question: "What should I promote to clear stock AND make money?"
	 *
	 * Prescriptive recommendation: PROMOTE_NOW vs AVOID
	 */
	getSlowMoversEffect(): Effect.Effect<
		SlowMoversResponse,
		DatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			const products = yield* withDrizzleErrors("products", "analytics", () =>
				(db as any).execute(sql`
					WITH inventory_velocity AS (
						SELECT 
							p.id,
							p.name,
							p.category,
							p."currentStockQuantity" as current_stock,
							p."basePrice",
							p."currentFIFOCost",
							(p."basePrice" - COALESCE(p."currentFIFOCost", 0)) / NULLIF(p."basePrice", 0) * 100 as margin_pct,
							COUNT(im.id) FILTER (
								WHERE im."movementType" = 'sale' 
								AND im."createdAt" >= CURRENT_DATE - INTERVAL '30 days'
							)::int as units_sold_30d
						FROM products p
						LEFT JOIN "inventoryMovements" im ON im."productId" = p.id
						WHERE p."organizationId" = ${organizationId}
							AND p."isActive" = true
						GROUP BY p.id
					)
					SELECT 
						id,
						name,
						category,
						current_stock,
						units_sold_30d,
						ROUND(margin_pct::numeric, 2)::float as margin_pct,
						CASE 
							WHEN units_sold_30d < 10 AND margin_pct > 35 THEN 'PROMOTE_NOW'
							WHEN units_sold_30d < 10 AND margin_pct BETWEEN 20 AND 35 THEN 'MODERATE_PROMO'
							WHEN units_sold_30d < 10 AND margin_pct < 20 THEN 'AVOID'
							ELSE 'MOVING_WELL'
						END as recommendation
					FROM inventory_velocity
					WHERE units_sold_30d < 50 OR current_stock > 100
					ORDER BY 
						CASE 
							WHEN units_sold_30d < 10 AND margin_pct > 35 THEN 1
							WHEN units_sold_30d < 10 AND margin_pct BETWEEN 20 AND 35 THEN 2
							ELSE 3
						END,
						margin_pct DESC
					LIMIT 20
				`) as Promise<RawQueryResult>
			);

			return { products: products.rows };
		});
	},

	/**
	 * Get customer capture ROI
	 *
	 * Business Question: "Are capture fees worth it? Which campaigns bring valuable customers?"
	 *
	 * Proves outcome-based pricing with receipts.
	 * Uses pure calculator for ROI computation.
	 */
	getCaptureROIEffect(): Effect.Effect<
		CaptureROIResponse,
		DatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			const campaigns = yield* withDrizzleErrors("customers", "analytics", () =>
				(db as any).execute(sql`
					WITH customer_ltv AS (
						SELECT 
							c.id,
							c."optInCampaignId",
							c."createdAt" as captured_at,
							COUNT(pc.id)::int as total_redemptions,
							COALESCE(SUM(pc."netRevenue"), 0)::float as lifetime_revenue,
							COALESCE(SUM(pc."actualProfit"), 0)::float as lifetime_profit
						FROM customers c
						LEFT JOIN "promoCodes" pc ON pc."customerId" = c.id AND pc."isRedeemed" = true
						WHERE c."organizationId" = ${organizationId}
							AND c."createdAt" >= CURRENT_DATE - INTERVAL '90 days'
						GROUP BY c.id
					)
					SELECT 
						cam.id as campaign_id,
						cam.name as capture_campaign,
						COUNT(ltv.id)::int as customers_captured,
						ROUND(AVG(ltv.lifetime_profit)::numeric, 2)::float as avg_ltv,
						SUM(ltv.lifetime_profit)::float as total_profit_generated,
						SUM(ltv.total_redemptions)::int as total_redemptions
					FROM customer_ltv ltv
					LEFT JOIN campaigns cam ON cam.id = ltv."optInCampaignId"
					WHERE cam.id IS NOT NULL
					GROUP BY cam.id, cam.name
					HAVING COUNT(ltv.id) > 0
					ORDER BY total_profit_generated DESC
					LIMIT 10
				`) as Promise<RawQueryResult>
			);

			// Use pure calculator for ROI
			const campaignsWithROI = campaigns.rows.map((c: any) => ({
				campaignId: c.campaign_id,
				captureCampaign: c.capture_campaign,
				customersCaptured: c.customers_captured,
				avgLTV: c.avg_ltv,
				totalProfitGenerated: c.total_profit_generated,
				totalRedemptions: c.total_redemptions,
				captureFeeROI: AnalyticsCalculator.calculateCaptureFeeROI(
					c.total_profit_generated,
					c.customers_captured,
					10, // KES 10 capture fee
				),
			}));

			return { campaigns: campaignsWithROI };
		});
	},

	/**
	 * Detect margin erosion mid-campaign
	 *
	 * Business Question: "Did my campaign profit flip from positive to negative?"
	 */
	getMarginErosionEffect(): Effect.Effect<
		MarginErosionResponse,
		DatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			const alerts = yield* withDrizzleErrors("campaigns", "analytics", () =>
				(db as any).execute(sql`
					WITH daily_margin AS (
						SELECT 
							c.id,
							c.name,
							DATE(pc."redeemedAt") as redemption_date,
							COUNT(pc.id)::int as redemptions,
							AVG(pc."actualProfit")::float as avg_profit,
							CASE 
								WHEN SUM(pc."netRevenue") > 0 
								THEN (SUM(pc."actualProfit") / SUM(pc."netRevenue")) * 100 
								ELSE 0 
							END as margin_pct
						FROM campaigns c
						JOIN "promoCodes" pc ON pc."campaignId" = c.id
						WHERE pc."isRedeemed" = true
							AND c."organizationId" = ${organizationId}
							AND c.status = 'active'
							AND pc."redeemedAt" >= CURRENT_DATE - INTERVAL '14 days'
						GROUP BY c.id, c.name, DATE(pc."redeemedAt")
					),
					margin_change AS (
						SELECT 
							*,
							LAG(margin_pct) OVER (PARTITION BY id ORDER BY redemption_date) as prev_margin,
							margin_pct - LAG(margin_pct) OVER (PARTITION BY id ORDER BY redemption_date) as margin_drop
						FROM daily_margin
					)
					SELECT 
						id,
						name,
						redemption_date::text,
						redemptions,
						ROUND(margin_pct::numeric, 2)::float as margin_pct,
						ROUND(COALESCE(prev_margin, 0)::numeric, 2)::float as prev_margin,
						ROUND(COALESCE(margin_drop, 0)::numeric, 2)::float as margin_drop,
						ROUND(avg_profit::numeric, 2)::float as avg_profit
					FROM margin_change
					WHERE margin_drop < -5
					ORDER BY redemption_date DESC, margin_drop ASC
				`) as Promise<RawQueryResult>
			);

			return { alerts: alerts.rows };
		});
	},

	/**
	 * Get category performance over time
	 *
	 * Business Question: "Which product types consistently win in promos?"
	 */
	getCategoryPerformanceEffect(): Effect.Effect<
		CategoryPerformanceResponse,
		DatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			const categories = yield* withDrizzleErrors("products", "analytics", () =>
				(db as any).execute(sql`
					SELECT 
						p.category,
						COUNT(DISTINCT c.id)::int as campaigns_run,
						COUNT(DISTINCT CASE WHEN SUM(pc."actualProfit") OVER (PARTITION BY c.id) > 0 THEN c.id END)::int as profitable_campaigns,
						ROUND(
							(COUNT(DISTINCT CASE WHEN SUM(pc."actualProfit") OVER (PARTITION BY c.id) > 0 THEN c.id END)::FLOAT / 
							 NULLIF(COUNT(DISTINCT c.id), 0)) * 100, 
							2
						)::float as success_rate_pct,
						ROUND(AVG(pc."actualProfit")::numeric, 2)::float as avg_profit_per_redemption,
						SUM(pc."actualProfit")::float as total_category_profit
					FROM campaigns c
					JOIN "promoCodes" pc ON pc."campaignId" = c.id
					JOIN products p ON p.id = pc."productId"
					WHERE pc."isRedeemed" = true
						AND c."organizationId" = ${organizationId}
						AND c."createdAt" >= CURRENT_DATE - INTERVAL '180 days'
					GROUP BY p.category
					ORDER BY success_rate_pct DESC, total_category_profit DESC
				`) as Promise<RawQueryResult>
			);

			return { categories: categories.rows };
		});
	},

	/**
	 * Get FIFO cost trends
 *
	 * Business Question: "Are my costs going up? When should I buy more?"
	 */
	getCostTrendsEffect(): Effect.Effect<
		CostTrendsResponse,
		DatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			const products = yield* withDrizzleErrors("products", "analytics", () =>
				(db as any).execute(sql`
					WITH cost_trends AS (
						SELECT 
							p.id,
							p.name,
							p.category,
							p."currentFIFOCost" as current_cost,
							AVG(poi."unitCost") FILTER (
								WHERE po."orderDate" >= CURRENT_DATE - INTERVAL '90 days'
							) as avg_cost_90d,
							AVG(poi."unitCost") FILTER (
								WHERE po."orderDate" >= CURRENT_DATE - INTERVAL '30 days'
							) as avg_cost_30d,
							p."currentStockQuantity",
							p."leadTimeDays"
						FROM products p
						LEFT JOIN "purchaseOrderItems" poi ON poi."productId" = p.id
						LEFT JOIN "purchaseOrders" po ON po.id = poi."purchaseOrderId"
						WHERE p."organizationId" = ${organizationId}
							AND p."isActive" = true
						GROUP BY p.id
					)
					SELECT 
						id,
						name,
						category,
						ROUND(COALESCE(current_cost, 0)::numeric, 2)::float as current_cost,
						ROUND(COALESCE(avg_cost_90d, 0)::numeric, 2)::float as avg_cost_90d,
						ROUND(COALESCE(avg_cost_30d, 0)::numeric, 2)::float as avg_cost_30d,
						ROUND(
							CASE 
								WHEN avg_cost_90d > 0 
								THEN ((avg_cost_30d - avg_cost_90d) / avg_cost_90d) * 100 
								ELSE 0 
							END::numeric, 
							2
						)::float as cost_increase_pct,
						"currentStockQuantity",
						"leadTimeDays",
						CASE 
							WHEN "currentStockQuantity" < 20 AND ((avg_cost_30d - avg_cost_90d) / NULLIF(avg_cost_90d, 0)) * 100 > 10 
								THEN 'BUY_NOW'
							WHEN "currentStockQuantity" < 20 THEN 'LOW_STOCK'
							WHEN ((avg_cost_30d - avg_cost_90d) / NULLIF(avg_cost_90d, 0)) * 100 > 15 
								THEN 'PRICE_SPIKE'
							ELSE 'STABLE'
						END as recommendation
					FROM cost_trends
					WHERE avg_cost_90d IS NOT NULL
					ORDER BY cost_increase_pct DESC NULLS LAST, "currentStockQuantity" ASC
					LIMIT 20
				`) as Promise<RawQueryResult>
			);

			return { products: products.rows };
		});
	},
	/**
	 * Get compliance audit summary
	 *
	 * Business Question: "Can I prove to KRA/regulators that I'm compliant?"
	 */
	getComplianceSummaryEffect(): Effect.Effect<
		ComplianceSummaryResponse,
		DatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			const logs = yield* withDrizzleErrors(
				"complianceLogs",
				"analytics",
				() =>
					(db as any).execute(sql`
					SELECT 
						TO_CHAR(DATE_TRUNC('month', cl."createdAt"), 'YYYY-MM') as month,
						cl."eventType",
						COUNT(*)::int as event_count,
						COUNT(DISTINCT cl."customerId")::int as unique_customers
					FROM "complianceLogs" cl
					WHERE cl."organizationId" = ${organizationId}
						AND cl."createdAt" >= CURRENT_DATE - INTERVAL '12 months'
					GROUP BY DATE_TRUNC('month', cl."createdAt"), cl."eventType"
					ORDER BY month DESC, event_count DESC
				`) as Promise<RawQueryResult>
			);

			return { logs: logs.rows };
		});
	},
};
