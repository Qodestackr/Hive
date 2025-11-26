import { createId } from "@paralleldrive/cuid2";
import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organizations } from "../auth/organizations";
import { customers } from "./customers";

// compliance audit log
export const complianceLogs = pgTable(
	"compliance_log",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),
		customerId: text("customer_id").references(() => customers.id, {
			onDelete: "cascade",
		}),

		// Audit details
		eventType: text("event_type").notNull(), // 'opt_in', 'opt_out', 'age_verified', 'promo_redeemed'
		description: text("description").notNull(),

		// Context
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		metadata: jsonb("metadata").$type<Record<string, any>>(),

		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [
		index("compliance_log_org_idx").on(table.organizationId),
		index("compliance_log_customer_idx").on(table.customerId),
		index("compliance_log_event_type_idx").on(table.eventType),
		index("compliance_log_created_idx").on(table.createdAt),
	],
);
