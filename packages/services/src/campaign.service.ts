import db, {
	and,
	campaigns,
	count,
	customers,
	eq,
	products,
	promoCodes,
	sql,
	sum,
	withDrizzleErrors,
} from "@repo/db";
import type {
	CampaignLtvAnalysisResponse,
	CampaignProfitabilityCheck,
	CampaignProfitabilityResponse,
} from "@repo/schema";
import { OrganizationContext } from "@repo/utils";
import {
	type DatabaseError,
	GenericDatabaseError,
	ProductNotFound,
} from "@repo/utils/errors/domain";
import { Effect } from "effect";
import { auditLogService } from "./audit-log.service";
import { ProfitCalculator } from "./calculators/profit-calculator";

export const campaignService = {
	/**
	 * Check campaign profitability BEFORE launch
	 *
	 * THE MOAT: Prevent money-losing promos before they go live.
	 * Shows exact profit/loss projection using current FIFO cost.
	 * Suggests profitable alternatives if losing money.
	 *
	 * @param data - Profitability check params
	 * @returns Profitability analysis with recommendations
	 */
	checkCampaignProfitabilityEffect(
		data: CampaignProfitabilityCheck,
	): Effect.Effect<
		CampaignProfitabilityResponse,
		ProductNotFound | DatabaseError | GenericDatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			// Get product with current FIFO cost
			const productRows = yield* withDrizzleErrors(
				"product",
				"findUnique",
				() =>
					db
						.select()
						.from(products)
						.where(
							and(
								eq(products.id, data.productId),
								eq(products.organizationId, organizationId),
							),
						)
						.limit(1),
			);

			const product = productRows[0];
			if (!product) {
				return yield* Effect.fail(
					new ProductNotFound({
						productId: data.productId,
						organizationId,
					}),
				);
			}

			if (!product.currentFIFOCost || product.currentFIFOCost === 0) {
				return yield* Effect.fail(
					new GenericDatabaseError({
						operation: "checkProfitability",
						table: "products",
						pgCode: undefined,
						detail: "Product has no FIFO cost. Record stock arrival first.",
						originalError: new Error("No FIFO cost"),
					}),
				);
			}

			// Calculate profitability using ProfitCalculator
			const basePrice = product.basePrice;
			const currentFIFOCost = product.currentFIFOCost;

			const profit = ProfitCalculator.calculate({
				basePrice,
				quantity: 1, // Default to 1 unit for pre-flight check
				discountType: data.discountAmount ? "fixed" : "percentage",
				discountValue: data.discountAmount || data.discountPercent,
				unitCost: currentFIFOCost,
			});

			// Generate recommendation if not profitable
			let recommendation: string | undefined;
			let suggestedDiscount: number | undefined;

			if (!profit.isProfitable) {
				// Calculate break-even discount using calculator
				const breakEven = ProfitCalculator.calculateBreakEven({
					basePrice,
					unitCost: currentFIFOCost,
					targetMarginPercent: 10,
				});

				suggestedDiscount = breakEven.safeDiscountPercent;

				recommendation =
					`⚠️ This campaign will LOSE KES ${Math.abs(profit.actualProfit).toFixed(2)} per redemption. ` +
					`Try ${suggestedDiscount}% off instead for a 10% profit margin.`;
			} else {
				recommendation = `✅ Profitable campaign: KES ${profit.actualProfit.toFixed(2)} profit per redemption.`;
			}

			// Log pre-flight profit check (audit trail)
			// Note: Will be converted to Effect when audit-log.service is refactored
			yield* Effect.promise(() =>
				auditLogService.log({
					organizationId,
					eventType: "campaign.profit_check",
					aggregateType: "product",
					aggregateId: data.productId,
					eventData: {
						productId: data.productId,
						basePrice,
						discountType: data.discountAmount ? "fixed" : "percentage",
						discountValue: data.discountAmount || data.discountPercent,
						currentFIFOCost,
						estimatedProfit: profit.actualProfit,
						isProfitable: profit.isProfitable,
						recommendation,
					},
				}),
			);

			// TODO: Find alternative products (slow movers with better margins)
			// Query products where:
			// - isSlowMover = true
			// - currentFIFOCost < basePrice * 0.6 (40%+ margin)
			// - currentStockQuantity > 0

			return {
				isProfitable: profit.isProfitable,
				estimatedProfit: profit.actualProfit,
				estimatedProfitPercent: profit.profitMargin,
				basePrice,
				discountAmount: profit.discountAmount,
				netRevenue: profit.netRevenue,
				currentFIFOCost,
				recommendation,
				suggestedDiscount,
				// alternativeProducts: [] // TODO: Implement slow-mover suggestions
			};
		});
	},

	/**
	 * Get campaign by ID with profit totals
	 *
	 * THE VALIDATION: Shows aggregated results from all promo redemptions.
	 * This is where you SEE if the FIFO profit calculations are working.
	 *
	 * @param campaignId - Campaign to retrieve
	 * @returns Campaign with all profit metrics
	 */
	getCampaignByIdEffect(
		campaignId: string,
	): Effect.Effect<
		any,
		GenericDatabaseError | DatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			const campaignRows = yield* withDrizzleErrors(
				"campaign",
				"findUnique",
				() =>
					db
						.select()
						.from(campaigns)
						.where(
							and(
								eq(campaigns.id, campaignId),
								eq(campaigns.organizationId, organizationId),
							),
						)
						.limit(1),
			);

			const campaign = campaignRows[0];
			if (!campaign) {
				return yield* Effect.fail(
					new GenericDatabaseError({
						operation: "findUnique",
						table: "campaigns",
						pgCode: undefined,
						detail: `Campaign ${campaignId} not found`,
						originalError: new Error("Campaign not found"),
					}),
				);
			}

			return campaign;
		});
	},

	/**
	 * Get campaign LTV analysis (Cohort Value)
	 *
	 * THE PROOF: Shows revenue generated specifically by this campaign's promo redemptions.
	 *
	 * ATTRIBUTION MODEL:
	 * - Uses promoCodes table (immutable transaction ledger)
	 * - Each redeemed promo = 1 revenue event attributed to its campaign
	 * - Customers can participate in multiple campaigns independently
	 * - Campaign LTV = SUM of netRevenue from all promos linked to this campaign
	 *
	 * WHAT THIS ANSWERS:
	 * - "How much revenue did Campaign A generate?" → sum of its promo redemptions
	 * - "How many unique customers redeemed from this campaign?" → distinct customerIds
	 * - "What's the average revenue per redemption?" → totalRevenue / redemptionCount
	 *
	 * ACCURACY GUARANTEE:
	 * - Works correctly even if customers join multiple campaigns
	 * - No double-counting (each promo redeemed exactly once)
	 * - No retroactive changes (promoCodes.campaignId is immutable)
	 *
	 * @param campaignId - Campaign to analyze
	 * @returns Cohort LTV metrics based on actual promo redemptions
	 */
	getCampaignLtvAnalysisEffect(
		campaignId: string,
	): Effect.Effect<
		CampaignLtvAnalysisResponse,
		DatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			// Get campaign revenue from immutable transaction ledger (promoCodes table)
			// This is the SOURCE OF TRUTH for campaign attribution
			const resultRows = yield* withDrizzleErrors(
				"promo_code",
				"findMany",
				() =>
					db
						.select({
							cohortSize: count(sql`DISTINCT ${promoCodes.customerId}`),
							totalCampaignRevenue: sum(promoCodes.netRevenue),
							totalCampaignProfit: sum(promoCodes.actualProfit),
							totalCOGS: sum(promoCodes.totalCOGS),
							redemptionCount: count(),
						})
						.from(promoCodes)
						.where(
							and(
								eq(promoCodes.campaignId, campaignId),
								eq(promoCodes.isRedeemed, true), // Only count actual redemptions
								eq(promoCodes.organizationId, organizationId),
							),
						),
			);

			const result = resultRows[0];
			const cohortSize = result?.cohortSize || 0;
			const totalCampaignRevenue = Number(result?.totalCampaignRevenue || 0);
			const totalCampaignProfit = Number(result?.totalCampaignProfit || 0);
			const redemptionCount = result?.redemptionCount || 0;

			return {
				campaignId,
				cohortSize, // Unique customers who redeemed from this campaign
				totalCohortLTV: totalCampaignRevenue, // Revenue generated by this campaign
				totalAttributedRevenue: totalCampaignRevenue, // Same as above (campaign-specific)
				averageLTV: cohortSize > 0 ? totalCampaignRevenue / cohortSize : 0,
				averageAttributedRevenue:
					redemptionCount > 0 ? totalCampaignRevenue / redemptionCount : 0,
			};
		});
	},
};
