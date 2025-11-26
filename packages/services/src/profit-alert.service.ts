import db, {
	and,
	campaigns,
	count,
	desc,
	eq,
	promoCodes,
	promoProfitAlerts,
	sql,
	sum,
	withDrizzleErrors,
} from "@repo/db";
import type {
	AlertSettingsResponse,
	AlertSettingsUpdate,
	AutoPauseActionResponse,
	BulkProfitCheckRequest,
	BulkProfitCheckResponse,
	ProfitCheckResponse,
	PromoProfitAlert,
	PromoProfitAlertCreate,
	PromoProfitAlertListQuery,
	PromoProfitAlertListResponse,
	PromoProfitAlertResolve,
	PromoProfitAlertSummary,
} from "@repo/schema";
import { OrganizationContext } from "@repo/utils";
import {
	type DatabaseError,
	GenericDatabaseError,
} from "@repo/utils/errors/domain";
import { Effect } from "effect";

export const profitAlertService = {
	/**
	 * Check campaign profit margin and compare against threshold
	 *
	 * THE CORE: Calculate current profit margin from redeemed promo codes.
	 * This is the deterministic calculation that drives all alerts.
	 *
	 * @param campaignId - Campaign to check
	 * @param createAlertIfBelow - Auto-create alert if below threshold
	 * @returns Current profit status
	 */
	checkCampaignProfitMarginEffect(
		campaignId: string,
		createAlertIfBelow: boolean = false,
	): Effect.Effect<
		ProfitCheckResponse,
		GenericDatabaseError | DatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			// Get campaign with alert settings
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

			// Aggregate profit from redeemed promo codes (immutable ledger)
			const statsRows = yield* withDrizzleErrors("promo_code", "findMany", () =>
				db
					.select({
						redemptionCount: count(
							sql`CASE WHEN ${promoCodes.isRedeemed} THEN 1 END`,
						),
						totalRevenue: sum(promoCodes.netRevenue),
						totalCOGS: sum(promoCodes.totalCOGS),
						totalProfit: sum(promoCodes.actualProfit),
					})
					.from(promoCodes)
					.where(
						and(
							eq(promoCodes.campaignId, campaignId),
							eq(promoCodes.organizationId, organizationId),
							eq(promoCodes.isRedeemed, true), // Only count actual redemptions
						),
					),
			);

			const stats = statsRows[0];
			const redemptionCount = stats?.redemptionCount || 0;
			const totalRevenue = Number(stats?.totalRevenue || 0);
			const totalCOGS = Number(stats?.totalCOGS || 0);
			const actualProfit = Number(stats?.totalProfit || 0);

			// Calculate profit margin
			const currentProfitMargin =
				totalRevenue > 0 ? (actualProfit / totalRevenue) * 100 : 0;

			const threshold = campaign.pauseThreshold || 10.0;
			const isAboveThreshold = currentProfitMargin >= threshold;

			let alertCreated = false;
			let alertId: string | undefined;

			// Auto-create alert if below threshold and requested
			if (createAlertIfBelow && !isAboveThreshold && redemptionCount > 0) {
				const alert = yield* profitAlertService.createAlertEffect({
					campaignId,
					alertType: "profit_threshold_breach",
					severity: currentProfitMargin < 0 ? "critical" : "warning",
					message: `Campaign profit margin (${currentProfitMargin.toFixed(1)}%) below threshold (${threshold}%)`,
					currentFIFOCost: totalCOGS / redemptionCount,
					redemptionsCount: redemptionCount,
					totalLoss: actualProfit < 0 ? Math.abs(actualProfit) : undefined,
					estimatedLossPerRedemption:
						redemptionCount > 0 ? actualProfit / redemptionCount : undefined,
				});

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
		});
	},

	/**
	 * Create a new profit alert
	 *
	 * @param data - Alert creation data
	 * @returns Created alert
	 */
	createAlertEffect(
		data: PromoProfitAlertCreate,
	): Effect.Effect<
		PromoProfitAlert,
		GenericDatabaseError | DatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			// Verify campaign exists
			const campaignRows = yield* withDrizzleErrors("campaign", "select", () =>
				db
					.select({ id: campaigns.id })
					.from(campaigns)
					.where(
						and(
							eq(campaigns.id, data.campaignId),
							eq(campaigns.organizationId, organizationId),
						),
					)
					.limit(1),
			);

			if (campaignRows.length === 0) {
				return yield* Effect.fail(
					new GenericDatabaseError({
						operation: "create",
						table: "promo_profit_alerts",
						pgCode: undefined,
						detail: `Campaign ${data.campaignId} not found`,
						originalError: new Error("Campaign not found"),
					}),
				);
			}

			// Create alert
			const alertRows = yield* withDrizzleErrors(
				"promo_profit_alert",
				"create",
				() =>
					db
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
							estimatedLossPerRedemption:
								data.estimatedLossPerRedemption ?? null,
							isResolved: false,
						})
						.returning(),
			);

			const alert = alertRows[0];

			if (!alert) {
				return yield* Effect.fail(
					new GenericDatabaseError({
						operation: "create",
						table: "promo_profit_alerts",
						pgCode: undefined,
						detail: "Failed to create alert",
						originalError: new Error("No rows returned from insert"),
					}),
				);
			}

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
		});
	},

	/**
	 * List alerts with filters and pagination
	 *
	 * @param query - Query parameters
	 * @returns Paginated alert list
	 */
	listAlertsEffect(
		query: PromoProfitAlertListQuery,
	): Effect.Effect<
		PromoProfitAlertListResponse,
		DatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			const {
				page = 1,
				limit = 20,
				campaignId,
				productId,
				alertType,
				severity,
				isResolved,
				sortBy = "createdAt",
				sortOrder = "desc",
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
			const totalRows = yield* withDrizzleErrors(
				"promo_profit_alert",
				"count",
				() =>
					db
						.select({ count: count() })
						.from(promoProfitAlerts)
						.where(and(...filters)),
			);

			const total = totalRows[0]?.count || 0;

			// Get paginated data
			const offset = (page - 1) * limit;

			// Map sortBy to column
			let orderByColumn: any = promoProfitAlerts.createdAt;
			if (sortBy === "severity") orderByColumn = promoProfitAlerts.severity;
			else if (sortBy === "totalLoss")
				orderByColumn = promoProfitAlerts.totalLoss;

			const orderFn = sortOrder === "desc" ? desc : (col: any) => col;

			const alerts = yield* withDrizzleErrors(
				"promo_profit_alert",
				"findMany",
				() =>
					db
						.select()
						.from(promoProfitAlerts)
						.where(and(...filters))
						.orderBy(orderFn(orderByColumn))
						.limit(limit)
						.offset(offset),
			);

			return {
				data: alerts.map((alert) => ({
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
					totalPages: Math.ceil(total / limit),
				},
			};
		});
	},

	/**
	 * Get alert summary for dashboard
	 *
	 * @returns Alert summary
	 */
	getAlertSummaryEffect(): Effect.Effect<
		PromoProfitAlertSummary,
		DatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			// Get aggregate stats
			const statsRows = yield* withDrizzleErrors(
				"promo_profit_alert",
				"findMany",
				() =>
					db
						.select({
							totalAlerts: count(),
							unresolvedAlerts: count(
								sql`CASE WHEN NOT ${promoProfitAlerts.isResolved} THEN 1 END`,
							),
							criticalAlerts: count(
								sql`CASE WHEN ${promoProfitAlerts.severity} = 'critical' THEN 1 END`,
							),
							totalEstimatedLoss: sum(promoProfitAlerts.totalLoss),
						})
						.from(promoProfitAlerts)
						.where(eq(promoProfitAlerts.organizationId, organizationId)),
			);

			const stats = statsRows[0];

			// Get alerts by type
			const byTypeRows = yield* withDrizzleErrors(
				"promo_profit_alert",
				"groupBy",
				() =>
					db
						.select({
							alertType: promoProfitAlerts.alertType,
							count: count(),
						})
						.from(promoProfitAlerts)
						.where(eq(promoProfitAlerts.organizationId, organizationId))
						.groupBy(promoProfitAlerts.alertType),
			);

			// Get alerts by severity
			const bySeverityRows = yield* withDrizzleErrors(
				"promo_profit_alert",
				"groupBy",
				() =>
					db
						.select({
							severity: promoProfitAlerts.severity,
							count: count(),
						})
						.from(promoProfitAlerts)
						.where(eq(promoProfitAlerts.organizationId, organizationId))
						.groupBy(promoProfitAlerts.severity),
			);

			// Get recent alerts
			const recentAlerts = yield* withDrizzleErrors(
				"promo_profit_alert",
				"findMany",
				() =>
					db
						.select()
						.from(promoProfitAlerts)
						.where(eq(promoProfitAlerts.organizationId, organizationId))
						.orderBy(desc(promoProfitAlerts.createdAt))
						.limit(5),
			);

			const alertsByType: Record<string, number> = {};
			byTypeRows.forEach((row) => {
				alertsByType[row.alertType] = row.count;
			});

			const alertsBySeverity: Record<string, number> = {};
			bySeverityRows.forEach((row) => {
				alertsBySeverity[row.severity] = row.count;
			});

			return {
				totalAlerts: stats?.totalAlerts || 0,
				unresolvedAlerts: stats?.unresolvedAlerts || 0,
				criticalAlerts: stats?.criticalAlerts || 0,
				totalEstimatedLoss: Number(stats?.totalEstimatedLoss || 0),
				alertsByType,
				alertsBySeverity,
				recentAlerts: recentAlerts.map((alert) => ({
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
		});
	},

	/**
	 * Resolve an alert
	 *
	 * @param alertId - Alert ID
	 * @param data - Resolution data
	 * @returns Updated alert
	 */
	resolveAlertEffect(
		alertId: string,
		data: PromoProfitAlertResolve,
	): Effect.Effect<
		PromoProfitAlert,
		GenericDatabaseError | DatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			const updatedRows = yield* withDrizzleErrors(
				"promo_profit_alert",
				"update",
				() =>
					db
						.update(promoProfitAlerts)
						.set({
							isResolved: true,
							actionTaken: data.actionTaken,
							resolvedAt: new Date(),
						})
						.where(
							and(
								eq(promoProfitAlerts.id, alertId),
								eq(promoProfitAlerts.organizationId, organizationId),
							),
						)
						.returning(),
			);

			const updated = updatedRows[0];
			if (!updated) {
				return yield* Effect.fail(
					new GenericDatabaseError({
						operation: "update",
						table: "promo_profit_alerts",
						pgCode: undefined,
						detail: `Alert ${alertId} not found`,
						originalError: new Error("Alert not found"),
					}),
				);
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
		});
	},

	/**
	 * Get alert settings for a campaign
	 *
	 * @param campaignId - Campaign ID
	 * @returns Alert settings
	 */
	getAlertSettingsEffect(
		campaignId: string,
	): Effect.Effect<
		AlertSettingsResponse,
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
						.select({
							id: campaigns.id,
							autoPauseEnabled: campaigns.autoPauseEnabled,
							pauseThreshold: campaigns.pauseThreshold,
							notificationsEnabled: campaigns.notificationsEnabled,
							alertCheckInterval: campaigns.alertCheckInterval,
						})
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

			return {
				campaignId: campaign.id,
				autoPauseEnabled: campaign.autoPauseEnabled ?? true,
				pauseThreshold: campaign.pauseThreshold ?? 10.0,
				notificationsEnabled: campaign.notificationsEnabled ?? true,
				alertCheckInterval: campaign.alertCheckInterval ?? 300,
			};
		});
	},

	/**
	 * Update alert settings for a campaign
	 *
	 * @param campaignId - Campaign ID
	 * @param data - Settings update
	 * @returns Updated settings
	 */
	updateAlertSettingsEffect(
		campaignId: string,
		data: AlertSettingsUpdate,
	): Effect.Effect<
		AlertSettingsResponse,
		GenericDatabaseError | DatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

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

			const updatedRows = yield* withDrizzleErrors("campaign", "update", () =>
				db
					.update(campaigns)
					.set({
						...updateData,
						updatedAt: new Date(),
					})
					.where(
						and(
							eq(campaigns.id, campaignId),
							eq(campaigns.organizationId, organizationId),
						),
					)
					.returning({
						id: campaigns.id,
						autoPauseEnabled: campaigns.autoPauseEnabled,
						pauseThreshold: campaigns.pauseThreshold,
						notificationsEnabled: campaigns.notificationsEnabled,
						alertCheckInterval: campaigns.alertCheckInterval,
					}),
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

			return {
				campaignId: updated.id,
				autoPauseEnabled: updated.autoPauseEnabled ?? true,
				pauseThreshold: updated.pauseThreshold ?? 10.0,
				notificationsEnabled: updated.notificationsEnabled ?? true,
				alertCheckInterval: updated.alertCheckInterval ?? 300,
			};
		});
	},

	/**
	 * Check and auto-pause campaign if below threshold
	 *
	 * @param campaignId - Campaign ID
	 * @returns Auto-pause action result
	 */
	autoPauseCampaignEffect(
		campaignId: string,
	): Effect.Effect<
		AutoPauseActionResponse,
		GenericDatabaseError | DatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			// Get campaign settings
			const campaignRows = yield* withDrizzleErrors("campaign", "select", () =>
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

			// Check profit margin
			const profitCheck =
				yield* profitAlertService.checkCampaignProfitMarginEffect(
					campaignId,
					true, // Create alert if below threshold
				);

			let wasPaused = false;
			let reason = "";

			// Auto-pause if enabled and below threshold
			if (campaign.autoPauseEnabled && !profitCheck.isAboveThreshold) {
				// Update campaign status to paused
				yield* withDrizzleErrors("campaign", "update", () =>
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
						),
				);

				wasPaused = true;
				reason = `Profit margin (${profitCheck.currentProfitMargin.toFixed(1)}%) below threshold (${profitCheck.threshold}%)`;
			} else if (!campaign.autoPauseEnabled) {
				reason = "Auto-pause disabled for this campaign";
			} else {
				reason = `Profit margin (${profitCheck.currentProfitMargin.toFixed(1)}%) above threshold (${profitCheck.threshold}%)`;
			}

			return {
				campaignId,
				wasPaused,
				reason,
				profitCheck,
			};
		});
	},

	/**
	 * Bulk profit check for multiple campaigns
	 *
	 * @param data - Bulk check request
	 * @returns Bulk check results
	 */
	bulkProfitCheckEffect(
		data: BulkProfitCheckRequest,
	): Effect.Effect<
		BulkProfitCheckResponse,
		DatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const results: ProfitCheckResponse[] = [];
			let belowThreshold = 0;
			let alertsCreated = 0;

			for (const campaignId of data.campaignIds) {
				try {
					const result =
						yield* profitAlertService.checkCampaignProfitMarginEffect(
							campaignId,
							data.createAlertsIfBelowThreshold,
						);

					results.push(result);

					if (!result.isAboveThreshold) {
						belowThreshold++;
					}

					if (result.alertCreated) {
						alertsCreated++;
					}
				} catch (error) {
					// Continue with other campaigns
				}
			}

			return {
				results,
				totalChecked: results.length,
				belowThreshold,
				alertsCreated,
			};
		});
	},
};
