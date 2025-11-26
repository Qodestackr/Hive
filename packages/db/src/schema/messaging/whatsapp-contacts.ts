import { createId } from "@paralleldrive/cuid2";
import {
	boolean,
	index,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { organizations } from "../auth/organizations";
import { customers } from "../customers/customers";

export const whatsappContacts = pgTable(
	"whatsapp_contact",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),
		customerId: text("customer_id").references(() => customers.id, {
			onDelete: "set null",
		}),

		// WhatsApp profile
		waId: text("wa_id").notNull(), // WhatsApp ID (phone number)
		profileName: text("profile_name"),

		// Conversation state
		lastMessageAt: timestamp("last_message_at"),
		isBlocked: boolean("is_blocked").default(false),

		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at")
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		uniqueIndex("whatsapp_contact_waid_org_idx").on(
			table.waId,
			table.organizationId,
		),
		index("whatsapp_contact_customer_idx").on(table.customerId),
	],
);
