import db, {
	and,
	asc,
	campaigns,
	count,
	customers,
	desc,
	eq,
	products,
	promoCodes,
	sql,
	sum,
	withDrizzleErrors,
} from "@repo/db";
import type {
	CampaignCreate,
	CampaignListQuery,
	CampaignListResponse,
	CampaignLtvAnalysisResponse,
	CampaignProfitabilityCheck,
	CampaignProfitabilityResponse,
	CampaignResponse,
	CampaignStats,
} from "@repo/schema";
import { OrganizationContext } from "@repo/utils";
import {
	type DatabaseError,
	GenericDatabaseError,
	ProductNotFound,
} from "@repo/utils/errors/domain";
import { Effect } from "effect";
import { auditLogService } from "./audit-log.service";
import { CampaignStatsCalculator } from "./calculators/campaign-stats-calculator";
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
			yield* auditLogService.logEffect({
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
			});

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
	/**
	 * Get campaign stats from immutable promoCode ledger
	 *
	 * THE VALIDATION: Real metrics from actual redemptions.
	 * Shows if FIFO profit tracking is working correctly.
	 *
	 * @param campaignId - Campaign ID
	 * @returns Campaign statistics
	 */
	getCampaignStatsEffect(
		campaignId: string,
	): Effect.Effect<CampaignStats, DatabaseError | GenericDatabaseError, OrganizationContext> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			// Get campaign
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

			// Aggregate from promoCode ledger (immutable source of truth)
			const statsRows = yield* withDrizzleErrors(
				"promo_code",
				"findMany",
				() =>
					db
						.select({
							totalCodes: count(),
							redeemedCodes: count(
								sql`CASE WHEN ${promoCodes.isRedeemed} THEN 1 END`,
							),
							totalRevenue: sum(promoCodes.netRevenue),
							totalDiscountCost: sum(promoCodes.discountAmount),
							totalCOGS: sum(promoCodes.totalCOGS),
							totalProfit: sum(promoCodes.actualProfit),
							profitableCodes: count(
								sql`CASE WHEN ${promoCodes.isProfitable} THEN 1 END`,
							),
						})
						.from(promoCodes)
						.where(
							and(
								eq(promoCodes.campaignId, campaignId),
								eq(promoCodes.organizationId, organizationId),
							),
						),
			);

			const stats = statsRows[0];
			const totalCodes = stats?.totalCodes || 0;
			const redeemedCodes = stats?.redeemedCodes || 0;
			const totalRevenue = Number(stats?.totalRevenue || 0);
			const discountCost = Number(stats?.totalDiscountCost || 0);
			const totalCOGS = Number(stats?.totalCOGS || 0);
			const actualProfit = Number(stats?.totalProfit || 0);
			const profitableCodes = stats?.profitableCodes || 0;

			const metrics = CampaignStatsCalculator.calculateMetrics({
				totalCodes,
				redeemedCodes,
				profitableCodes,
				totalRevenue,
				discountCost,
				totalCOGS,
				actualProfit,
				sent: campaign.sent || 0,
				delivered: campaign.delivered || 0,
				opened: campaign.opened || 0,
				clicked: campaign.clicked || 0,
				conversions: campaign.conversions || 0,
			});

			return {
				campaignId,
				campaignName: campaign.name,
				status: campaign.status as any,
				sent: campaign.sent || 0,
				delivered: campaign.delivered || 0,
				opened: campaign.opened || 0,
				clicked: campaign.clicked || 0,
				conversions: campaign.conversions || 0,
				capturesCount: campaign.capturesCount || 0,
				revenue: totalRevenue,
				discountCost,
				totalCOGS,
				actualProfit,
				avgProfitPerRedemption: metrics.avgProfitPerRedemption,
				deliveryRate: metrics.deliveryRate,
				openRate: metrics.openRate,
				clickRate: metrics.clickRate,
				conversionRate: metrics.conversionRate,
				roi: metrics.roi,
			};
		});
	},

	/**
	 * Generate bulk promo codes
	 *
	 * @param campaignId - Campaign ID
	 * @param count - Number of codes to generate
	 * @returns Generated codes
	 */
	generateCodesEffect(
		campaignId: string,
		count: number,
	): Effect.Effect<
		{ success: boolean; generated: number; codes: string[] },
		DatabaseError | GenericDatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			// Verify campaign exists
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

			// Generate unique codes
			const codes: string[] = [];
			const prefix = campaign.name
				.substring(0, 4)
				.toUpperCase()
				.replace(/\s/g, "");

			for (let i = 0; i < count; i++) {
				const randomPart = Math.random()
					.toString(36)
					.substring(2, 8)
					.toUpperCase();
				codes.push(`${prefix}-${randomPart}`);
			}

			// Insert codes
			const defaultExpiryDate =
				campaign.endsAt || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days default

			const insertedCodes = yield* withDrizzleErrors(
				"promo_code",
				"create",
				() =>
					db
						.insert(promoCodes)
						.values(
							codes.map((code) => ({
								organizationId,
								campaignId,
								code,
								discountType: (campaign.offerType === "percentage"
									? "percentage"
									: "fixed") as "percentage" | "fixed",
								discountValue: campaign.offerValue || 0,
								expiresAt: defaultExpiryDate,
								isRedeemed: false,
								isProfitable: null,
							})),
						)
						.returning(),
			);

			return {
				success: true,
				generated: insertedCodes.length,
				codes: insertedCodes.map((c) => c.code),
			};
		});
	},

	/**
	 * Export codes as CSV
	 *
	 * @param campaignId - Campaign ID
	 * @returns CSV string
	 */
	exportCodesEffect(
		campaignId: string,
	): Effect.Effect<
		{ csv: string; totalCodes: number; redeemedCodes: number },
		DatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			const codes = yield* withDrizzleErrors(
				"promo_code",
				"findMany",
				() =>
					db
						.select({
							code: promoCodes.code,
							isRedeemed: promoCodes.isRedeemed,
							redeemedAt: promoCodes.redeemedAt,
							customerId: promoCodes.customerId,
						})
						.from(promoCodes)
						.where(
							and(
								eq(promoCodes.campaignId, campaignId),
								eq(promoCodes.organizationId, organizationId),
							),
						)
						.orderBy(desc(promoCodes.createdAt)),
			);

			// Generate CSV
			const headers = "Code,Status,Redeemed At,Customer ID\n";
			const rows = codes
				.map(
					(c) =>
						`${c.code},${c.isRedeemed ? "Redeemed" : "Available"},${c.redeemedAt || ""},${c.customerId || ""}`,
				)
				.join("\n");

			return {
				csv: headers + rows,
				totalCodes: codes.length,
				redeemedCodes: codes.filter((c) => c.isRedeemed).length,
			};
		});
	},

	/**
	 * Pause campaign
	 *
	 * @param campaignId - Campaign ID
	 * @returns Updated campaign
	 */
	pauseCampaignEffect(
		campaignId: string,
	): Effect.Effect<
		CampaignResponse,
		DatabaseError | GenericDatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			const updatedRows = yield* withDrizzleErrors(
				"campaign",
				"update",
				() =>
					db
						.update(campaigns)
						.set({
							status: "paused",
							updatedAt: new Date(),
						})
						.where(
							and(
								eq(campaigns.id, campaignId),
								eq(campaigns.organizationId, organizationId),
							),
						)
						.returning(),
			);

			const updated = updatedRows[0];
			if (!updated) {
				return yield* Effect.fail(
					new GenericDatabaseError({
						operation: "update",
						table: "campaigns",
						pgCode: undefined,
						detail: `Campaign ${campaignId} not found`,
						originalError: new Error("Campaign not found"),
					}),
				);
			}

			return updated as CampaignResponse;
		});
	},

	/**
	 * Resume campaign
	 *
	 * @param campaignId - Campaign ID
	 * @returns Updated campaign
	 */
	resumeCampaignEffect(
		campaignId: string,
	): Effect.Effect<
		CampaignResponse,
		DatabaseError | GenericDatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			const updatedRows = yield* withDrizzleErrors(
				"campaign",
				"update",
				() =>
					db
						.update(campaigns)
						.set({
							status: "active",
							updatedAt: new Date(),
						})
						.where(
							and(
								eq(campaigns.id, campaignId),
								eq(campaigns.organizationId, organizationId),
							),
						)
						.returning(),
			);

			const updated = updatedRows[0];
			if (!updated) {
				return yield* Effect.fail(
					new GenericDatabaseError({
						operation: "update",
						table: "campaigns",
						pgCode: undefined,
						detail: `Campaign ${campaignId} not found`,
						originalError: new Error("Campaign not found"),
					}),
				);
			}

			return updated as CampaignResponse;
		});
	},

	/**
	 * List campaigns with filters and pagination
	 *
	 * @param query - Query parameters
	 * @returns Paginated campaign list
	 */
	listCampaignsEffect(
		query: CampaignListQuery,
	): Effect.Effect<
		CampaignListResponse,
		DatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			const {
				page = 1,
				limit = 20,
				status,
				type,
				isLosingMoney,
				sortBy = "createdAt",
				sortOrder = "desc",
			} = query;

			// Build filters
			const filters = [eq(campaigns.organizationId, organizationId)];

			if (status) {
				filters.push(eq(campaigns.status, status));
			}

			if (type) {
				filters.push(eq(campaigns.type, type));
			}

			if (isLosingMoney !== undefined) {
				filters.push(eq(campaigns.isLosingMoney, isLosingMoney));
			}

			// Get total count
			const totalRows = yield* withDrizzleErrors("campaign", "count", () =>
				db
					.select({ count: count() })
					.from(campaigns)
					.where(and(...filters)),
			);

			const total = totalRows[0]?.count || 0;

			// Get paginated data
			const offset = (page - 1) * limit;
			const orderFn = sortOrder === "asc" ? asc : desc;

			// Map sortBy to column
			let orderByColumn: any = campaigns.createdAt;
			if (sortBy === "name") orderByColumn = campaigns.name;
			else if (sortBy === "status") orderByColumn = campaigns.status;
			else if (sortBy === "actualProfit") orderByColumn = campaigns.actualProfit;
			else if (sortBy === "capturesCount")
				orderByColumn = campaigns.capturesCount;

			const data = yield* withDrizzleErrors(
				"campaign",
				"findMany",
				() =>
					db
						.select()
						.from(campaigns)
						.where(and(...filters))
						.orderBy(orderFn(orderByColumn))
						.limit(limit)
						.offset(offset),
			);

			return {
				data: data as CampaignResponse[],
				pagination: {
					page,
					limit,
					total,
					totalPages: Math.ceil(total / limit),
				},
			};
		});
	},

	/**
	 * Create campaign
	 *
	 * @param data - Campaign creation data
	 * @returns Created campaign
	 */
	createCampaignEffect(
		data: CampaignCreate,
	): Effect.Effect<
		CampaignResponse,
		DatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			const campaignRows = yield* withDrizzleErrors(
				"campaign",
				"create",
				() =>
					db
						.insert(campaigns)
						.values({
							organizationId,
							name: data.name,
							type: data.type,
							status: "draft",
							messageTemplate: data.messageTemplate,
							platforms: data.platforms || ["whatsapp"],
							targetSegment: data.targetSegment ?? null,
							targetRadius: data.targetRadius ?? null,
							targetProductIds: data.targetProductIds ?? null,
							offerType: data.offerType,
							offerValue: data.offerValue ?? null,
							minPurchaseAmount: data.minPurchaseAmount ?? null,
							minProfitThreshold: data.minProfitThreshold ?? null,
							saleorVoucherCode: null,
							maxRedemptions: data.maxRedemptions ?? null,
							scheduledFor: data.scheduledFor
								? new Date(data.scheduledFor)
								: null,
							startsAt: data.startsAt ? new Date(data.startsAt) : null,
							endsAt: data.endsAt ? new Date(data.endsAt) : null,
							budgetAmount: data.budgetAmount ?? null,
						})
						.returning(),
			);

			return campaignRows[0] as CampaignResponse;
		});
	},
};
