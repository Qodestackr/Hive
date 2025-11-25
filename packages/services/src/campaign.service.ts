import { createError } from "@repo/utils";
import db, {
    withDbOperation,
    products,
    campaigns,
    customers,
    promoCodes,
    eq, and,
    sql, sum, count
} from "@repo/db";

import { ProfitCalculator } from "./calculators/profit-calculator";
import { auditLogService } from "./audit-log.service";

import type {
    CampaignProfitabilityCheck,
    CampaignProfitabilityResponse,
    CampaignLtvAnalysisResponse
} from "@repo/schema";

export const campaignService = {
    /**
     * Check campaign profitability BEFORE launch
     * 
     * THE MOAT: Prevent money-losing promos before they go live.
     * Shows exact profit/loss projection using current FIFO cost.
     * Suggests profitable alternatives if losing money.
     * 
     * @param data - Profitability check params
     * @param organizationId - Organization context
     * @returns Profitability analysis with recommendations
     */
    async checkCampaignProfitability(
        data: CampaignProfitabilityCheck,
        organizationId: string
    ): Promise<CampaignProfitabilityResponse> {
        // Get product with current FIFO cost
        const product = await withDbOperation({
            operation: "findUnique",
            table: "product",
            context: { organizationId, productId: data.productId }
        }, () => db
            .select()
            .from(products)
            .where(and(
                eq(products.id, data.productId),
                eq(products.organizationId, organizationId)
            ))
            .limit(1)
            .then(rows => rows[0])
        );

        if (!product) {
            throw createError.notFound("Product", {
                productId: data.productId,
                organizationId
            });
        }

        if (!product.currentFIFOCost || product.currentFIFOCost === 0) {
            throw createError.businessRule("no_fifo_cost", {
                productId: data.productId,
                message: "Product has no FIFO cost. Record stock arrival first."
            });
        }

        // Calculate profitability using ProfitCalculator
        const basePrice = product.basePrice;
        const currentFIFOCost = product.currentFIFOCost;

        const profit = ProfitCalculator.calculate({
            basePrice,
            quantity: 1, // Default to 1 unit for pre-flight check
            discountType: data.discountAmount ? 'fixed' : 'percentage',
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

            recommendation = `⚠️ This campaign will LOSE KES ${Math.abs(profit.actualProfit).toFixed(2)} per redemption. ` +
                `Try ${suggestedDiscount}% off instead for a 10% profit margin.`;
        } else {
            recommendation = `✅ Profitable campaign: KES ${profit.actualProfit.toFixed(2)} profit per redemption.`;
        }

        // Log pre-flight profit check (audit trail)
        await auditLogService.log({
            organizationId,
            eventType: 'campaign.profit_check',
            aggregateType: 'product',
            aggregateId: data.productId,
            eventData: {
                productId: data.productId,
                basePrice,
                discountType: data.discountAmount ? 'fixed' : 'percentage',
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
    },

    /**
     * Get campaign by ID with profit totals
     * 
     * THE VALIDATION: Shows aggregated results from all promo redemptions.
     * This is where you SEE if the FIFO profit calculations are working.
     * 
     * @param campaignId - Campaign to retrieve
     * @param organizationId - Organization context
     * @returns Campaign with all profit metrics
     */
    async getCampaignById(
        campaignId: string,
        organizationId: string
    ) {
        const campaign = await withDbOperation({
            operation: "findUnique",
            table: "campaign",
            context: { organizationId, campaignId }
        }, () => db
            .select()
            .from(campaigns)
            .where(and(
                eq(campaigns.id, campaignId),
                eq(campaigns.organizationId, organizationId)
            ))
            .limit(1)
            .then(rows => rows[0])
        );

        if (!campaign) {
            throw createError.notFound("Campaign", { campaignId, organizationId });
        }

        return campaign;
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
     * @param organizationId - Organization context
     * @returns Cohort LTV metrics based on actual promo redemptions
     */
    async getCampaignLtvAnalysis(
        campaignId: string,
        organizationId: string
    ): Promise<CampaignLtvAnalysisResponse> {
        // Get campaign revenue from immutable transaction ledger (promoCodes table)
        // This is the SOURCE OF TRUTH for campaign attribution
        const result = await withDbOperation({
            operation: "findMany",
            table: "promo_code",
            context: { organizationId, campaignId }
        }, () => db
            .select({
                cohortSize: count(sql`DISTINCT ${promoCodes.customerId}`),
                totalCampaignRevenue: sum(promoCodes.netRevenue),
                totalCampaignProfit: sum(promoCodes.actualProfit),
                totalCOGS: sum(promoCodes.totalCOGS),
                redemptionCount: count(),
            })
            .from(promoCodes)
            .where(and(
                eq(promoCodes.campaignId, campaignId),
                eq(promoCodes.isRedeemed, true), // Only count actual redemptions
                eq(promoCodes.organizationId, organizationId)
            ))
            .then(rows => rows[0])
        );

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
            averageAttributedRevenue: redemptionCount > 0 ? totalCampaignRevenue / redemptionCount : 0,
        };
    },
};
