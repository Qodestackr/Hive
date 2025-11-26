import { createId } from "@paralleldrive/cuid2";
import {
	index,
	jsonb,
	pgTable,
	real,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { organizations } from "../auth/organizations";

export const invoices = pgTable(
	"invoice",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),

		// Invoice details
		number: text("number").notNull().unique(),
		periodStart: timestamp("period_start").notNull(),
		periodEnd: timestamp("period_end").notNull(),

		// Charges breakdown
		baseCharge: real("base_charge").notNull(), // Monthly subscription
		outcomeCharge: real("outcome_charge").default(0), // Based on captures/profit
		additionalUserCharge: real("additional_user_charge").default(0),

		totalAmount: real("total_amount").notNull(),
		tax: real("tax").default(0),

		// Payment
		status: text("status").notNull().default("draft"), // draft, open, paid, void
		paidAt: timestamp("paid_at"),
		dueDate: timestamp("due_date").notNull(),

		// Metadata (outcome breakdown)
		metadata: jsonb("metadata").$type<{
			capturesCount?: number;
			profitGenerated?: number;
			activeUsers?: number;
		}>(),

		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at")
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		uniqueIndex("invoice_number_idx").on(table.number),
		index("invoice_org_idx").on(table.organizationId),
		index("invoice_status_idx").on(table.status),
		index("invoice_due_idx").on(table.dueDate),
	],
);

export type Invoice = typeof invoices.$inferSelect;
export type InvoiceInsert = typeof invoices.$inferInsert;
