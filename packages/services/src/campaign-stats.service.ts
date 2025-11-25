/**
 * Campaign Stats Service
 * 
 * Aggregate real campaign metrics from promoCodes table.
 * THE PROOF: Shows actual performance using immutable transaction ledger.
 */

import { createError } from "@repo/utils";
import db, {
    withDbOperation,
    campaigns,
    promoCodes,
    eq, and, sql, count, sum, desc
} from "@repo/db";

import type {
    CampaignStats,
    CampaignListQuery,
    CampaignListResponse,
    CampaignCreate,
    CampaignUpdate,
    CampaignResponse,
} from "@repo/schema";

export const campaignStatsService = {
    /**
     * Get campaign stats from immutable promoCode ledger
     * 
     * THE VALIDATION: Real metrics from actual redemptions.
     * Shows if FIFO profit tracking is working correctly.
     * 
     * @param campaignId - Campaign ID
     * @param organizationId - Organization context
     * @returns Campaign statistics
     */
    async getCampaignStats(
        campaignId: string,
        organizationId: string
    ): Promise<CampaignStats> {
        // Get campaign
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

        // Aggregate from promoCode ledger (immutable source of truth)
        const stats = await withDbOperation({
            operation: "findMany",
            table: "promo_code",
            context: { organizationId, campaignId }
        }, () => db
            .select({
                totalCodes: count(),
                redeemedCodes: count(sql`CASE WHEN ${promoCodes.isRedeemed} THEN 1 END`),
                totalRevenue: sum(promoCodes.netRevenue),
                totalDiscountCost: sum(promoCodes.discountAmount),
                totalCOGS: sum(promoCodes.totalCOGS),
                totalProfit: sum(promoCodes.actualProfit),
                profitableCodes: count(sql`CASE WHEN ${promoCodes.isProfitable} THEN 1 END`),
            })
            .from(promoCodes)
            .where(and(
                eq(promoCodes.campaignId, campaignId),
                eq(promoCodes.organizationId, organizationId)
            ))
            .then(rows => rows[0])
        );

        const totalCodes = stats?.totalCodes || 0;
        const redeemedCodes = stats?.redeemedCodes || 0;
        const totalRevenue = Number(stats?.totalRevenue || 0);
        const discountCost = Number(stats?.totalDiscountCost || 0);
        const totalCOGS = Number(stats?.totalCOGS || 0);
        const actualProfit = Number(stats?.totalProfit || 0);
        const profitableCodes = stats?.profitableCodes || 0;

        // Calculate rates
        const redemptionRate = totalCodes > 0 ? (redeemedCodes / totalCodes) * 100 : 0;
        const lossRate = redeemedCodes > 0 ? ((redeemedCodes - profitableCodes) / redeemedCodes) * 100 : 0;
        const avgProfitPerRedemption = redeemedCodes > 0 ? actualProfit / redeemedCodes : null;

        // Calculate engagement metrics
        const sent = campaign.sent || 0;
        const delivered = campaign.delivered || 0;
        const opened = campaign.opened || 0;
        const clicked = campaign.clicked || 0;
        const conversions = campaign.conversions || 0;

        const deliveryRate = sent > 0 ? (delivered / sent) * 100 : 0;
        const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
        const clickRate = opened > 0 ? (clicked / opened) * 100 : 0;
        const conversionRate = clicked > 0 ? (conversions / clicked) * 100 : 0;

        // Calculate ROI
        const totalCost = discountCost;
        const roi = totalCost > 0 ? ((actualProfit / totalCost) * 100) : 0;

        return {
            campaignId,
            campaignName: campaign.name,
            status: campaign.status as any,
            sent,
            delivered,
            opened,
            clicked,
            conversions,
            capturesCount: campaign.capturesCount || 0,
            revenue: totalRevenue,
            discountCost,
            totalCOGS,
            actualProfit,
            avgProfitPerRedemption,
            deliveryRate,
            openRate,
            clickRate,
            conversionRate,
            roi,
        };
    },

    /**
     * Generate bulk promo codes
     * 
     * @param campaignId - Campaign ID
     * @param count - Number of codes to generate
     * @param organizationId - Organization context
     * @returns Generated codes
     */
    async generateCodes(
        campaignId: string,
        count: number,
        organizationId: string
    ) {
        // Verify campaign exists
        const campaign = await db
            .select()
            .from(campaigns)
            .where(and(
                eq(campaigns.id, campaignId),
                eq(campaigns.organizationId, organizationId)
            ))
            .limit(1)
            .then(rows => rows[0]);

        if (!campaign) {
            throw createError.notFound("Campaign", { campaignId, organizationId });
        }

        // Generate unique codes
        const codes: string[] = [];
        const prefix = campaign.name.substring(0, 4).toUpperCase().replace(/\s/g, '');

        for (let i = 0; i < count; i++) {
            const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
            codes.push(`${prefix}-${randomPart}`);
        }

        // Insert codes
        const insertedCodes = await withDbOperation({
            operation: "create",
            table: "promo_code",
            context: { organizationId, campaignId }
        }, () => db
            .insert(promoCodes)
            .values(
                codes.map(code => ({
                    organizationId,
                    campaignId,
                    code,
                    isRedeemed: false,
                    isProfitable: null,
                }))
            )
            .returning()
        );

        return {
            success: true,
            generated: insertedCodes.length,
            codes: insertedCodes.map(c => c.code)
        };
    },

    /**
     * Export codes as CSV
     * 
     * @param campaignId - Campaign ID
     * @param organizationId - Organization context
     * @returns CSV string
     */
    async exportCodes(
        campaignId: string,
        organizationId: string
    ) {
        const codes = await withDbOperation({
            operation: "findMany",
            table: "promo_code",
            context: { organizationId, campaignId }
        }, () => db
            .select({
                code: promoCodes.code,
                isRedeemed: promoCodes.isRedeemed,
                redeemedAt: promoCodes.redeemedAt,
                customerId: promoCodes.customerId,
            })
            .from(promoCodes)
            .where(and(
                eq(promoCodes.campaignId, campaignId),
                eq(promoCodes.organizationId, organizationId)
            ))
            .orderBy(desc(promoCodes.createdAt))
        );

        // Generate CSV
        const headers = 'Code,Status,Redeemed At,Customer ID\n';
        const rows = codes.map(c =>
            `${c.code},${c.isRedeemed ? 'Redeemed' : 'Available'},${c.redeemedAt || ''},${c.customerId || ''}`
        ).join('\n');

        return {
            csv: headers + rows,
            totalCodes: codes.length,
            redeemedCodes: codes.filter(c => c.isRedeemed).length
        };
    },

    /**
     * Pause campaign
     * 
     * @param campaignId - Campaign ID
     * @param organizationId - Organization context
     * @returns Updated campaign
     */
    async pauseCampaign(
        campaignId: string,
        organizationId: string
    ): Promise<CampaignResponse> {
        const [updated] = await withDbOperation({
            operation: "update",
            table: "campaign",
            context: { organizationId, campaignId }
        }, () => db
            .update(campaigns)
            .set({
                status: 'paused',
                updatedAt: new Date(),
            })
            .where(and(
                eq(campaigns.id, campaignId),
                eq(campaigns.organizationId, organizationId)
            ))
            .returning()
        );

        if (!updated) {
            throw createError.notFound("Campaign", { campaignId, organizationId });
        }

        return updated as CampaignResponse;
    },

    /**
     * Resume campaign
     * 
     * @param campaignId - Campaign ID
     * @param organizationId - Organization context
     * @returns Updated campaign
     */
    async resumeCampaign(
        campaignId: string,
        organizationId: string
    ): Promise<CampaignResponse> {
        const [updated] = await withDbOperation({
            operation: "update",
            table: "campaign",
            context: { organizationId, campaignId }
        }, () => db
            .update(campaigns)
            .set({
                status: 'active',
                updatedAt: new Date(),
            })
            .where(and(
                eq(campaigns.id, campaignId),
                eq(campaigns.organizationId, organizationId)
            ))
            .returning()
        );

        if (!updated) {
            throw createError.notFound("Campaign", { campaignId, organizationId });
        }

        return updated as CampaignResponse;
    },

    /**
     * List campaigns with filters and pagination
     * 
     * @param query - Query parameters
     * @param organizationId - Organization context
     * @returns Paginated campaign list
     */
    async listCampaigns(
        query: CampaignListQuery,
        organizationId: string
    ): Promise<CampaignListResponse> {
        const {
            page = 1,
            limit = 20,
            status,
            type,
            isLosingMoney,
            startDate,
            endDate,
            sortBy = 'createdAt',
            sortOrder = 'desc'
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
        const totalResult = await withDbOperation({
            operation: "count",
            table: "campaign",
            context: { organizationId }
        }, () => db
            .select({ count: count() })
            .from(campaigns)
            .where(and(...filters))
            .then(rows => rows[0])
        );

        const total = totalResult?.count || 0;

        // Get paginated data
        const offset = (page - 1) * limit;
        const orderFn = sortOrder === 'asc' ? asc : desc;

        // Map sortBy to column
        let orderByColumn = campaigns.createdAt;
        if (sortBy === 'name') orderByColumn = campaigns.name;
        else if (sortBy === 'status') orderByColumn = campaigns.status;
        else if (sortBy === 'actualProfit') orderByColumn = campaigns.actualProfit;
        else if (sortBy === 'capturesCount') orderByColumn = campaigns.capturesCount;

        const data = await withDbOperation({
            operation: "findMany",
            table: "campaign",
            context: { organizationId }
        }, () => db
            .select()
            .from(campaigns)
            .where(and(...filters))
            .orderBy(orderFn(orderByColumn))
            .limit(limit)
            .offset(offset)
        );

        return {
            data: data as CampaignResponse[],
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    },

    /**
     * Create campaign
     * 
     * @param data - Campaign creation data
     * @param organizationId - Organization context
     * @returns Created campaign
     */
    async createCampaign(
        data: CampaignCreate,
        organizationId: string
    ): Promise<CampaignResponse> {
        const [campaign] = await withDbOperation({
            operation: "create",
            table: "campaign",
            context: { organizationId }
        }, () => db
            .insert(campaigns)
            .values({
                organizationId,
                name: data.name,
                type: data.type,
                status: 'draft',
                messageTemplate: data.messageTemplate,
                platforms: data.platforms || ['whatsapp'],
                targetSegment: data.targetSegment ?? null,
                targetRadius: data.targetRadius ?? null,
                targetProductIds: data.targetProductIds ?? null,
                offerType: data.offerType,
                offerValue: data.offerValue ?? null,
                minPurchaseAmount: data.minPurchaseAmount ?? null,
                minProfitThreshold: data.minProfitThreshold ?? null,
                saleorVoucherCode: null,
                maxRedemptions: data.maxRedemptions ?? null,
                scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
                startsAt: data.startsAt ? new Date(data.startsAt) : null,
                endsAt: data.endsAt ? new Date(data.endsAt) : null,
                budgetAmount: data.budgetAmount ?? null,
            })
            .returning()
        );

        return campaign as CampaignResponse;
    },
};
