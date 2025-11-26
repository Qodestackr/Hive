import { createId } from "@paralleldrive/cuid2";
import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organizations } from "../auth/organizations";
import { campaigns } from "../campaigns/campaigns";
import { whatsappContacts } from "./whatsapp-contacts";

export const whatsappMessages = pgTable(
	"whatsapp_message",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),
		contactId: text("contact_id")
			.notNull()
			.references(() => whatsappContacts.id, { onDelete: "cascade" }),
		campaignId: text("campaign_id").references(() => campaigns.id, {
			onDelete: "set null",
		}),

		// Message details
		waMessageId: text("wa_message_id"), // WhatsApp API message ID
		direction: text("direction").notNull(), // 'outbound', 'inbound'
		body: text("body"),
		mediaUrl: text("media_url"),

		// Status tracking
		status: text("status").notNull().default("pending"), // pending, sent, delivered, read, failed
		errorCode: text("error_code"),

		sentAt: timestamp("sent_at"),
		deliveredAt: timestamp("delivered_at"),
		readAt: timestamp("read_at"),

		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [
		index("whatsapp_message_contact_idx").on(table.contactId),
		index("whatsapp_message_campaign_idx").on(table.campaignId),
		index("whatsapp_message_status_idx").on(table.status),
	],
);
