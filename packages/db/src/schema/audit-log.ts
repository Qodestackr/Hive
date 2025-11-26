/**
 * Audit Log Schema
 *
 * Immutable append-only event log for trust-critical operations.
 * Provides billing-grade audit trail for outcome-based pricing.
 */

import { createId } from "@paralleldrive/cuid2";
import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Audit Events Table
 *
 * IMMUTABLE - Events are never updated or deleted, only appended.
 *
 * Used for:
 * - Dispute resolution (customer claims wrong billing)
 * - Debugging (what happened when?)
 * - Compliance (regulatory audit trail)
 * - AI agent reasoning (query historical events)
 */
export const auditEvents = pgTable(
	"audit_events",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),

		organizationId: text("organization_id").notNull(),

		// Event classification
		eventType: text("event_type").notNull(), // 'promo.redeemed', 'campaign.paused'

		// What entity this event relates to
		aggregateType: text("aggregate_type").notNull(), // 'promo_code', 'campaign', 'customer'
		aggregateId: text("aggregate_id").notNull(),

		// Event payload (flexible JSONB)
		eventData: jsonb("event_data").notNull(),

		// Timestamps
		createdAt: timestamp("created_at").defaultNow().notNull(),

		// Who triggered this event (optional, for user actions)
		createdBy: text("created_by"),
	},
	(table) => [
		// Index for querying by organization and event type
		index("idx_audit_events_org_type").on(
			table.organizationId,
			table.eventType,
		),

		// Index for querying events for a specific aggregate
		index("idx_audit_events_aggregate").on(
			table.aggregateType,
			table.aggregateId,
		),

		// Index for time-based queries
		index("idx_audit_events_created_at").on(table.createdAt),
	],
);

export type AuditEvent = typeof auditEvents.$inferSelect;
export type AuditEventInsert = typeof auditEvents.$inferInsert;
