import { createId } from "@paralleldrive/cuid2";
import {
	index,
	integer,
	jsonb,
	pgTable,
	real,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { organizations } from "../auth/organizations";

// ============================================================================
// OUTCOME SNAPSHOTS:
// Freeze metrics at billing time—captures, conversions, profit, campaign breakdown,
// and the pricing model that was active. This is billing-grade immutability.
// Allows to prove exactly what value you created in any period. No disputes.
// ============================================================================

export const outcomeSnapshots = pgTable(
	"outcome_snapshot",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),
		invoiceId: text("invoice_id").notNull(),

		// Billing period
		periodStart: timestamp("period_start").notNull(),
		periodEnd: timestamp("period_end").notNull(),

		// Frozen outcome metrics at billing time
		capturesCount: integer("captures_count").notNull().default(0),
		conversions: integer("conversions").notNull().default(0),
		revenue: real("revenue").notNull().default(0),
		discountCost: real("discount_cost").notNull().default(0),
		profit: real("profit").notNull().default(0),

		// Campaign-level breakdown for audit trail
		campaignBreakdown:
			jsonb("campaign_breakdown").$type<
				Array<{
					campaignId: string;
					name: string;
					captures: number;
					conversions: number;
					revenue: number;
					discountCost: number;
					profit: number;
				}>
			>(),

		// Pricing model snapshot (frozen at billing time)
		pricingSnapshot: jsonb("pricing_snapshot").$type<{
			pricingVersion: string;
			basePrice: number;
			outcomeBasePer1000Captures: number;
			outcomeProfitSharePercent: number;
		}>(),

		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [
		index("outcome_snapshot_invoice_idx").on(table.invoiceId),
		index("outcome_snapshot_org_idx").on(table.organizationId),
		index("outcome_snapshot_period_idx").on(table.periodStart, table.periodEnd),
	],
);

// Type exports
export type OutcomeSnapshot = typeof outcomeSnapshots.$inferSelect;
export type OutcomeSnapshotInsert = typeof outcomeSnapshots.$inferInsert;
