/**
 * Profit Alert Service
 * 
 * Real-time profit monitoring and alert generation.
 * Enables distributors to catch losing campaigns mid-flight.
 */

import { createError } from "@repo/utils";
import db, {
    withDbOperation,
    campaigns,
    promoCodes,
    promoProfitAlerts,
    eq, and, sql, count, sum, desc, or
} from "@repo/db";

import type {
    PromoProfitAlert,
    PromoProfitAlertCreate,
    PromoProfitAlertResolve,
    PromoProfitAlertListQuery,
    PromoProfitAlertListResponse,
    PromoProfitAlertSummary,
    AlertSettingsUpdate,
    AlertSettingsResponse,
    ProfitCheckResponse,
    BulkProfitCheckRequest,
    BulkProfitCheckResponse,
    AutoPauseActionResponse,
} from "@repo/schema";

export const profitAlertService = {
    /**
     * Check campaign profit margin and compare against threshold
     * 
     * THE CORE: Calculate current profit margin from redeemed promo codes.
     * This is the deterministic calculation that drives all alerts.
     * 
     * @param campaignId - Campaign to check
     * @param organizationId - Organization context
     * @param createAlertIfBelow - Auto-create alert if below threshold
     * @returns Current profit status
     */
    async checkCampaignProfitMargin(
        campaignId: string,
        organizationId: string,
        createAlertIfBelow: boolean = false
    ): Promise<ProfitCheckResponse> {
        // Get campaign with alert settings
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

        // Aggregate profit from redeemed promo codes (immutable ledger)
        const stats = await withDbOperation({
            operation: "findMany",
            table: "promo_code",
            context: { organizationId, campaignId }
        }, () => db
            .select({
                redemptionCount: count(sql`CASE WHEN ${promoCodes.isRedeemed} THEN 1 END`),
                totalRevenue: sum(promoCodes.netRevenue),
                totalCOGS: sum(promoCodes.totalCOGS),
                totalProfit: sum(promoCodes.actualProfit),
            })
            .from(promoCodes)
            .where(and(
                eq(promoCodes.campaignId, campaignId),
                eq(promoCodes.organizationId, organizationId),
                eq(promoCodes.isRedeemed, true) // Only count actual redemptions
            ))
            .then(rows => rows[0])
        );

        const redemptionCount = stats?.redemptionCount || 0;
        const totalRevenue = Number(stats?.totalRevenue || 0);
        const totalCOGS = Number(stats?.totalCOGS || 0);
        const actualProfit = Number(stats?.totalProfit || 0);

        // Calculate profit margin
        const currentProfitMargin = totalRevenue > 0
            ? (actualProfit / totalRevenue) * 100
            : 0;

        const threshold = campaign.pauseThreshold || 10.0;
        const isAboveThreshold = currentProfitMargin >= threshold;

        let alertCreated = false;
        let alertId: string | undefined;

        // Auto-create alert if below threshold and requested
        if (createAlertIfBelow && !isAboveThreshold && redemptionCount > 0) {
            const alert = await this.createAlert({
                campaignId,
                alertType: "profit_threshold_breach",
                severity: currentProfitMargin < 0 ? "critical" : "warning",
                message: `Campaign profit margin (${currentProfitMargin.toFixed(1)}%) below threshold (${threshold}%)`,
                currentFIFOCost: totalCOGS / redemptionCount,
                redemptionsCount: redemptionCount,
                totalLoss: actualProfit < 0 ? Math.abs(actualProfit) : undefined,
                estimatedLossPerRedemption: redemptionCount > 0 ? actualProfit / redemptionCount : undefined,
            }, organizationId);

            alertCreated = true;
            alertId = alert.id;
        }

        return {
            campaignId,
            currentProfitMargin,
            threshold,
            isAboveThreshold,
            totalRevenue,
            totalCOGS,
            actualProfit,
            redemptionCount,
            alertCreated,
            alertId,
        };
    },

    /**
     * Create a new profit alert
     * 
     * @param data - Alert creation data
     * @param organizationId - Organization context
     * @returns Created alert
     */
    async createAlert(
        data: PromoProfitAlertCreate,
        organizationId: string
    ): Promise<PromoProfitAlert> {
        // Verify campaign exists
        const campaign = await db
            .select({ id: campaigns.id })
            .from(campaigns)
            .where(and(
                eq(campaigns.id, data.campaignId),
                eq(campaigns.organizationId, organizationId)
            ))
            .limit(1)
            .then(rows => rows[0]);

        if (!campaign) {
            throw createError.notFound("Campaign", {
                campaignId: data.campaignId,
                organizationId
            });
        }

        // Create alert
        const [alert] = await withDbOperation({
            operation: "create",
            table: "promo_profit_alert",
            context: { organizationId, campaignId: data.campaignId }
        }, () => db
            .insert(promoProfitAlerts)
            .values({
                organizationId,
                campaignId: data.campaignId,
                productId: data.productId ?? null,
                alertType: data.alertType,
                severity: data.severity,
                message: data.message,
                currentFIFOCost: data.currentFIFOCost ?? null,
                discountPercent: data.discountPercent ?? null,
                redemptionsCount: data.redemptionsCount ?? null,
                totalLoss: data.totalLoss ?? null,
                estimatedLossPerRedemption: data.estimatedLossPerRedemption ?? null,
                isResolved: false,
            })
            .returning()
        );

        return {
            id: alert.id,
            organizationId: alert.organizationId,
            campaignId: alert.campaignId,
            productId: alert.productId,
            alertType: alert.alertType as any,
            severity: alert.severity as any,
            message: alert.message,
            currentFIFOCost: alert.currentFIFOCost,
            discountPercent: alert.discountPercent,
            redemptionsCount: alert.redemptionsCount,
            totalLoss: alert.totalLoss,
            estimatedLossPerRedemption: alert.estimatedLossPerRedemption,
            isResolved: alert.isResolved,
            actionTaken: alert.actionTaken,
            resolvedAt: alert.resolvedAt?.toISOString() ?? null,
            createdAt: alert.createdAt.toISOString(),
        };
    },

    /**
     * List alerts with filters and pagination
     * 
     * @param query - Query parameters
     * @param organizationId - Organization context
     * @returns Paginated alert list
     */
    async listAlerts(
        query: PromoProfitAlertListQuery,
        organizationId: string
    ): Promise<PromoProfitAlertListResponse> {
        const {
            page = 1,
            limit = 20,
            campaignId,
            productId,
            alertType,
            severity,
            isResolved,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = query;

        // Build filters
        const filters = [eq(promoProfitAlerts.organizationId, organizationId)];

        if (campaignId) {
            filters.push(eq(promoProfitAlerts.campaignId, campaignId));
        }

        if (productId) {
            filters.push(eq(promoProfitAlerts.productId, productId));
        }

        if (alertType) {
            filters.push(eq(promoProfitAlerts.alertType, alertType));
        }

        if (severity) {
            filters.push(eq(promoProfitAlerts.severity, severity));
        }

        if (isResolved !== undefined) {
            filters.push(eq(promoProfitAlerts.isResolved, isResolved));
        }

        // Get total count
        const totalResult = await withDbOperation({
            operation: "count",
            table: "promo_profit_alert",
            context: { organizationId }
        }, () => db
            .select({ count: count() })
            .from(promoProfitAlerts)
            .where(and(...filters))
            .then(rows => rows[0])
        );

        const total = totalResult?.count || 0;

        // Get paginated data
        const offset = (page - 1) * limit;

        // Map sortBy to column
        let orderByColumn = promoProfitAlerts.createdAt;
        if (sortBy === 'severity') orderByColumn = promoProfitAlerts.severity;
        else if (sortBy === 'totalLoss') orderByColumn = promoProfitAlerts.totalLoss;

        const orderFn = sortOrder === 'desc' ? desc : (col: any) => col;

        const alerts = await withDbOperation({
            operation: "findMany",
            table: "promo_profit_alert",
            context: { organizationId }
        }, () => db
            .select()
            .from(promoProfitAlerts)
            .where(and(...filters))
            .orderBy(orderFn(orderByColumn))
            .limit(limit)
            .offset(offset)
        );

        return {
            data: alerts.map(alert => ({
                id: alert.id,
                organizationId: alert.organizationId,
                campaignId: alert.campaignId,
                productId: alert.productId,
                alertType: alert.alertType as any,
                severity: alert.severity as any,
                message: alert.message,
                currentFIFOCost: alert.currentFIFOCost,
                discountPercent: alert.discountPercent,
                redemptionsCount: alert.redemptionsCount,
                totalLoss: alert.totalLoss,
                estimatedLossPerRedemption: alert.estimatedLossPerRedemption,
                isResolved: alert.isResolved,
                actionTaken: alert.actionTaken,
                resolvedAt: alert.resolvedAt?.toISOString() ?? null,
                createdAt: alert.createdAt.toISOString(),
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    },

    /**
     * Get alert summary for dashboard
     * 
     * @param organizationId - Organization context
     * @returns Alert summary
     */
    async getAlertSummary(
        organizationId: string
    ): Promise<PromoProfitAlertSummary> {
        // Get aggregate stats
        const stats = await withDbOperation({
            operation: "findMany",
            table: "promo_profit_alert",
            context: { organizationId }
        }, () => db
            .select({
                totalAlerts: count(),
                unresolvedAlerts: count(sql`CASE WHEN NOT ${promoProfitAlerts.isResolved} THEN 1 END`),
                criticalAlerts: count(sql`CASE WHEN ${promoProfitAlerts.severity} = 'critical' THEN 1 END`),
                totalEstimatedLoss: sum(promoProfitAlerts.totalLoss),
            })
            .from(promoProfitAlerts)
            .where(eq(promoProfitAlerts.organizationId, organizationId))
            .then(rows => rows[0])
        );

        // Get alerts by type
        const byType = await db
            .select({
                alertType: promoProfitAlerts.alertType,
                count: count(),
            })
            .from(promoProfitAlerts)
            .where(eq(promoProfitAlerts.organizationId, organizationId))
            .groupBy(promoProfitAlerts.alertType);

        // Get alerts by severity
        const bySeverity = await db
            .select({
                severity: promoProfitAlerts.severity,
                count: count(),
            })
            .from(promoProfitAlerts)
            .where(eq(promoProfitAlerts.organizationId, organizationId))
            .groupBy(promoProfitAlerts.severity);

        // Get recent alerts
        const recentAlerts = await db
            .select()
            .from(promoProfitAlerts)
            .where(eq(promoProfitAlerts.organizationId, organizationId))
            .orderBy(desc(promoProfitAlerts.createdAt))
            .limit(5);

        const alertsByType: Record<string, number> = {};
        byType.forEach(row => {
            alertsByType[row.alertType] = row.count;
        });

        const alertsBySeverity: Record<string, number> = {};
        bySeverity.forEach(row => {
            alertsBySeverity[row.severity] = row.count;
        });

        return {
            totalAlerts: stats?.totalAlerts || 0,
            unresolvedAlerts: stats?.unresolvedAlerts || 0,
            criticalAlerts: stats?.criticalAlerts || 0,
            totalEstimatedLoss: Number(stats?.totalEstimatedLoss || 0),
            alertsByType,
            alertsBySeverity,
            recentAlerts: recentAlerts.map(alert => ({
                id: alert.id,
                organizationId: alert.organizationId,
                campaignId: alert.campaignId,
                productId: alert.productId,
                alertType: alert.alertType as any,
                severity: alert.severity as any,
                message: alert.message,
                currentFIFOCost: alert.currentFIFOCost,
                discountPercent: alert.discountPercent,
                redemptionsCount: alert.redemptionsCount,
                totalLoss: alert.totalLoss,
                estimatedLossPerRedemption: alert.estimatedLossPerRedemption,
                isResolved: alert.isResolved,
                actionTaken: alert.actionTaken,
                resolvedAt: alert.resolvedAt?.toISOString() ?? null,
                createdAt: alert.createdAt.toISOString(),
            })),
        };
    },

    /**
     * Resolve an alert
     * 
     * @param alertId - Alert ID
     * @param data - Resolution data
     * @param organizationId - Organization context
     * @returns Updated alert
     */
    async resolveAlert(
        alertId: string,
        data: PromoProfitAlertResolve,
        organizationId: string
    ): Promise<PromoProfitAlert> {
        const [updated] = await withDbOperation({
            operation: "update",
            table: "promo_profit_alert",
            context: { organizationId, alertId }
        }, () => db
            .update(promoProfitAlerts)
            .set({
                isResolved: true,
                actionTaken: data.actionTaken,
                resolvedAt: new Date(),
            })
            .where(and(
                eq(promoProfitAlerts.id, alertId),
                eq(promoProfitAlerts.organizationId, organizationId)
            ))
            .returning()
        );

        if (!updated) {
            throw createError.notFound("Alert", { alertId, organizationId });
        }

        return {
            id: updated.id,
            organizationId: updated.organizationId,
            campaignId: updated.campaignId,
            productId: updated.productId,
            alertType: updated.alertType as any,
            severity: updated.severity as any,
            message: updated.message,
            currentFIFOCost: updated.currentFIFOCost,
            discountPercent: updated.discountPercent,
            redemptionsCount: updated.redemptionsCount,
            totalLoss: updated.totalLoss,
            estimatedLossPerRedemption: updated.estimatedLossPerRedemption,
            isResolved: updated.isResolved,
            actionTaken: updated.actionTaken,
            resolvedAt: updated.resolvedAt?.toISOString() ?? null,
            createdAt: updated.createdAt.toISOString(),
        };
    },

    /**
     * Get alert settings for a campaign
     * 
     * @param campaignId - Campaign ID
     * @param organizationId - Organization context
     * @returns Alert settings
     */
    async getAlertSettings(
        campaignId: string,
        organizationId: string
    ): Promise<AlertSettingsResponse> {
        const campaign = await withDbOperation({
            operation: "findUnique",
            table: "campaign",
            context: { organizationId, campaignId }
        }, () => db
            .select({
                id: campaigns.id,
                autoPauseEnabled: campaigns.autoPauseEnabled,
                pauseThreshold: campaigns.pauseThreshold,
                notificationsEnabled: campaigns.notificationsEnabled,
                alertCheckInterval: campaigns.alertCheckInterval,
            })
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

        return {
            campaignId: campaign.id,
            autoPauseEnabled: campaign.autoPauseEnabled ?? true,
            pauseThreshold: campaign.pauseThreshold ?? 10.0,
            notificationsEnabled: campaign.notificationsEnabled ?? true,
            alertCheckInterval: campaign.alertCheckInterval ?? 300,
        };
    },

    /**
     * Update alert settings for a campaign
     * 
     * @param campaignId - Campaign ID
     * @param data - Settings update
     * @param organizationId - Organization context
     * @returns Updated settings
     */
    async updateAlertSettings(
        campaignId: string,
        data: AlertSettingsUpdate,
        organizationId: string
    ): Promise<AlertSettingsResponse> {
        const updateData: any = {};

        if (data.autoPauseEnabled !== undefined) {
            updateData.autoPauseEnabled = data.autoPauseEnabled;
        }

        if (data.pauseThreshold !== undefined) {
            updateData.pauseThreshold = data.pauseThreshold;
        }

        if (data.notificationsEnabled !== undefined) {
            updateData.notificationsEnabled = data.notificationsEnabled;
        }

        if (data.alertCheckInterval !== undefined) {
            updateData.alertCheckInterval = data.alertCheckInterval;
        }

        const [updated] = await withDbOperation({
            operation: "update",
            table: "campaign",
            context: { organizationId, campaignId }
        }, () => db
            .update(campaigns)
            .set({
                ...updateData,
                updatedAt: new Date(),
            })
            .where(and(
                eq(campaigns.id, campaignId),
                eq(campaigns.organizationId, organizationId)
            ))
            .returning({
                id: campaigns.id,
                autoPauseEnabled: campaigns.autoPauseEnabled,
                pauseThreshold: campaigns.pauseThreshold,
                notificationsEnabled: campaigns.notificationsEnabled,
                alertCheckInterval: campaigns.alertCheckInterval,
            })
        );

        if (!updated) {
            throw createError.notFound("Campaign", { campaignId, organizationId });
        }

        return {
            campaignId: updated.id,
            autoPauseEnabled: updated.autoPauseEnabled ?? true,
            pauseThreshold: updated.pauseThreshold ?? 10.0,
            notificationsEnabled: updated.notificationsEnabled ?? true,
            alertCheckInterval: updated.alertCheckInterval ?? 300,
        };
    },

    /**
     * Check and auto-pause campaign if below threshold
     * 
     * @param campaignId - Campaign ID
     * @param organizationId - Organization context
     * @returns Auto-pause action result
     */
    async autoPauseCampaign(
        campaignId: string,
        organizationId: string
    ): Promise<AutoPauseActionResponse> {
        // Get campaign settings
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

        // Check profit margin
        const profitCheck = await this.checkCampaignProfitMargin(
            campaignId,
            organizationId,
            true // Create alert if below threshold
        );

        let wasPaused = false;
        let reason = '';

        // Auto-pause if enabled and below threshold
        if (campaign.autoPauseEnabled && !profitCheck.isAboveThreshold) {
            // Update campaign status to paused
            await withDbOperation({
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
            );

            wasPaused = true;
            reason = `Profit margin (${profitCheck.currentProfitMargin.toFixed(1)}%) below threshold (${profitCheck.threshold}%)`;
        } else if (!campaign.autoPauseEnabled) {
            reason = 'Auto-pause disabled for this campaign';
        } else {
            reason = `Profit margin (${profitCheck.currentProfitMargin.toFixed(1)}%) above threshold (${profitCheck.threshold}%)`;
        }

        return {
            campaignId,
            wasPaused,
            reason,
            profitCheck,
        };
    },

    /**
     * Bulk profit check for multiple campaigns
     * 
     * @param data - Bulk check request
     * @param organizationId - Organization context
     * @returns Bulk check results
     */
    async bulkProfitCheck(
        data: BulkProfitCheckRequest,
        organizationId: string
    ): Promise<BulkProfitCheckResponse> {
        const results: ProfitCheckResponse[] = [];
        let belowThreshold = 0;
        let alertsCreated = 0;

        for (const campaignId of data.campaignIds) {
            try {
                const result = await this.checkCampaignProfitMargin(
                    campaignId,
                    organizationId,
                    data.createAlertsIfBelowThreshold
                );

                results.push(result);

                if (!result.isAboveThreshold) {
                    belowThreshold++;
                }

                if (result.alertCreated) {
                    alertsCreated++;
                }
            } catch (error) {
                // Skip campaigns that don't exist or have errors
                // Could log error here
                continue;
            }
        }

        return {
            results,
            totalChecked: results.length,
            belowThreshold,
            alertsCreated,
        };
    },
};
