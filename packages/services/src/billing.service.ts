import type { Invoice } from "@repo/db";
import db, {
	and,
	campaigns,
	eq,
	gte,
	invoices,
	lte,
	organizations,
	outcomeSnapshots,
	promoCodes,
	sql,
	withDrizzleErrors,
} from "@repo/db";
import { mastra } from "@repo/ai";
import { OrganizationContext } from "@repo/utils";
import {
	type DatabaseError,
	GenericDatabaseError,
	InvoiceNotFound,
} from "@repo/utils/errors/domain";
import { Effect } from "effect";
import { buildInvoiceMutation } from "./mutations/billing-mutations";

export const billingService = {
	/**
	 * Generate invoice for a billing period
	 * Creates immutable outcome snapshot and invoice
	 */
	generateInvoiceEffect(
		periodStart: Date,
		periodEnd: Date,
	): Effect.Effect<Invoice, DatabaseError, OrganizationContext> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			// 0. Fetch organization pricing configuration
			const orgRows = yield* withDrizzleErrors(
				"organizations",
				"findById",
				() =>
					db
						.select()
						.from(organizations)
						.where(eq(organizations.id, organizationId))
						.limit(1),
			);

			const organization = orgRows[0];
			if (!organization) {
				return yield* Effect.fail(
					new GenericDatabaseError({
						operation: "findById",
						table: "organizations",
						pgCode: undefined,
						detail: "Organization not found during billing",
						originalError: new Error("Organization not found"),
					}),
				);
			}

			// Construct pricing snapshot from organization settings
			// Fallback to defaults if not set (though schema enforces some)
			const pricingSnapshot = {
				pricingVersion: organization.pricingVersion || "v1",
				basePrice: organization.basePrice || 0,
				outcomeBasePer1000Captures:
					organization.outcomeBasePer1000Captures || 0,
				outcomeProfitSharePercent: organization.outcomeProfitSharePercent || 0,
			};

			// 1. Query promo codes redeemed in period
			const redeemedPromos = yield* withDrizzleErrors(
				"promo_codes",
				"findRedeemed",
				() =>
					db
						.select()
						.from(promoCodes)
						.where(
							and(
								eq(promoCodes.organizationId, organizationId),
								eq(promoCodes.isRedeemed, true),
								gte(promoCodes.redeemedAt, periodStart),
								lte(promoCodes.redeemedAt, periodEnd),
							),
						),
			);

			// 2. Calculate metrics
			const capturesCount = redeemedPromos.length;
			const profitGenerated = redeemedPromos.reduce(
				(sum, promo) => sum + (promo.actualProfit || 0),
				0,
			);

			// 3. Build campaign breakdown
			const campaignMap = new Map<
				string,
				{
					campaignId: string;
					name: string;
					captures: number;
					conversions: number;
					revenue: number;
					discountCost: number;
					profit: number;
				}
			>();

			for (const promo of redeemedPromos) {
				if (!promo.campaignId) continue;

				const existing = campaignMap.get(promo.campaignId) || {
					campaignId: promo.campaignId,
					name: "",
					captures: 0,
					conversions: 0,
					revenue: 0,
					discountCost: 0,
					profit: 0,
				};

				existing.captures += 1;
				existing.conversions += promo.quantityRedeemed || 1;
				existing.revenue += promo.netRevenue || 0;
				existing.discountCost += promo.discountAmount || 0;
				existing.profit += promo.actualProfit || 0;

				campaignMap.set(promo.campaignId, existing);
			}

			// Fetch campaign names
			const campaignIds = Array.from(campaignMap.keys());
			if (campaignIds.length > 0) {
				const campaignRows = yield* withDrizzleErrors(
					"campaigns",
					"findByIds",
					() =>
						db
							.select()
							.from(campaigns)
							.where(sql`${campaigns.id} = ANY(${campaignIds})`),
				);

				for (const campaign of campaignRows) {
					const breakdown = campaignMap.get(campaign.id);
					if (breakdown) {
						breakdown.name = campaign.name;
					}
				}
			}

			const campaignBreakdown = Array.from(campaignMap.values());

			// 4. Build invoice mutation (pure function)
			const { invoice: invoiceData, outcomeSnapshot: snapshotData } =
				buildInvoiceMutation({
					organizationId,
					periodStart,
					periodEnd,
					capturesCount,
					profitGenerated,
					pricingSnapshot,
					campaignBreakdown,
				});

			// 5. Apply mutations (DB operations)
			const [invoice] = yield* withDrizzleErrors("invoices", "create", () =>
				db.insert(invoices).values(invoiceData).returning(),
			);

			yield* withDrizzleErrors("outcome_snapshots", "create", () =>
				db.insert(outcomeSnapshots).values(snapshotData),
			);

			return invoice;
		});
	},

	getInvoiceEffect(
		invoiceId: string,
	): Effect.Effect<
		Invoice,
		InvoiceNotFound | DatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			const invoiceRows = yield* withDrizzleErrors("invoices", "findById", () =>
				db
					.select()
					.from(invoices)
					.where(
						and(
							eq(invoices.id, invoiceId),
							eq(invoices.organizationId, organizationId),
						),
					)
					.limit(1),
			);

			const invoice = invoiceRows[0];
			if (!invoice) {
				return yield* Effect.fail(new InvoiceNotFound({ invoiceId }));
			}

			return invoice;
		});
	},

	/**
	 * List invoices with pagination
	 */
	listInvoicesEffect(query: {
		page: number;
		limit: number;
		status?: string;
	}): Effect.Effect<
		{
			data: Invoice[];
			pagination: {
				page: number;
				limit: number;
				total: number;
				totalPages: number;
			};
		},
		DatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;
			const { page, limit, status } = query;
			const offset = (page - 1) * limit;

			// Build where conditions
			const conditions = [eq(invoices.organizationId, organizationId)];
			if (status) {
				conditions.push(eq(invoices.status, status));
			}

			// Get total count
			const [{ count }] = yield* withDrizzleErrors("invoices", "count", () =>
				db
					.select({ count: sql<number>`count(*)` })
					.from(invoices)
					.where(and(...conditions)),
			);

			// Get paginated data
			const data = yield* withDrizzleErrors("invoices", "list", () =>
				db
					.select()
					.from(invoices)
					.where(and(...conditions))
					.orderBy(sql`${invoices.createdAt} DESC`)
					.limit(limit)
					.offset(offset),
			);

			return {
				data,
				pagination: {
					page,
					limit,
					total: count,
					totalPages: Math.ceil(count / limit),
				},
			};
		});
	},

	/**
	 * Get invoice with campaign breakdown from outcome snapshot
	 * Used for AI insight generation
	 */
	getInvoiceWithCampaignBreakdownEffect(
		invoiceId: string,
	): Effect.Effect<
		{
			invoice: Invoice;
			campaignBreakdown: Array<{
				name: string;
				profit: number;
				revenue: number;
				captures: number;
			}>;
			totalProfit: number;
			capturesCount: number;
		},
		InvoiceNotFound | DatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			const invoice = yield* billingService.getInvoiceEffect(invoiceId);

			const snapshotRows = yield* withDrizzleErrors(
				"outcome_snapshots",
				"findByInvoice",
				() =>
					db
						.select()
						.from(outcomeSnapshots)
						.where(
							and(
								eq(outcomeSnapshots.invoiceId, invoiceId),
								eq(outcomeSnapshots.organizationId, organizationId),
							),
						)
						.limit(1),
			);

			const snapshot = snapshotRows[0];
			if (!snapshot) {
				return yield* Effect.fail(
					new GenericDatabaseError({
						operation: "findByInvoice",
						table: "outcome_snapshots",
						pgCode: undefined,
						detail: "No outcome snapshot found for invoice",
						originalError: new Error("Snapshot not found"),
					}),
				);
			}

			const campaignBreakdown = (snapshot.campaignBreakdown || []) as Array<{
				name: string;
				profit: number;
				revenue: number;
				captures: number;
			}>;

			return {
				invoice,
				campaignBreakdown,
				totalProfit: snapshot.profit,
				capturesCount: snapshot.capturesCount,
			};
		});
	},

	/**
	 * Generate AI insight for invoice
	 * Analyzes campaign performance and provides strategic recommendations
	 */
	generateInvoiceInsightEffect(
		periodStart: Date,
		periodEnd: Date,
		campaignBreakdown: Array<{
			name: string;
			profit: number;
			revenue: number;
			captures: number;
		}>,
		totalProfit: number,
		capturesCount: number,
		profitThreshold: number = 10000,
	): Effect.Effect<string, Error, never> {
		return Effect.gen(function* (_) {
			const agent = mastra.getAgent('billingInsightAgent');
			if (!agent) {
				return yield* _(Effect.fail(new Error('Billing insight agent not found')));
			}

			const analysisData = {
				periodStart: periodStart.toISOString().split('T')[0],
				periodEnd: periodEnd.toISOString().split('T')[0],
				campaigns: campaignBreakdown.map((c) => ({
					name: c.name,
					profit: c.profit,
					revenue: c.revenue,
					captures: c.captures,
					belowThreshold: c.profit < profitThreshold,
				})),
				totalProfit,
				capturesCount,
			};

			const response = yield* _(
				Effect.tryPromise({
					try: async () =>
						agent.generate([
							{
								role: 'user',
								content: JSON.stringify(analysisData, null, 2),
							},
						]),
					catch: (error) => new Error(`AI insight generation failed: ${error}`),
				}),
			);

			return response.text;
		});
	},
};
