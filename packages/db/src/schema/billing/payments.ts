import { createId } from "@paralleldrive/cuid2";
import {
	index,
	jsonb,
	pgTable,
	real,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { paymentProviderEnum } from "../../enums";
import { invoices } from "./invoices";

export const payments = pgTable(
	"payment",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		invoiceId: text("invoice_id")
			.notNull()
			.references(() => invoices.id, { onDelete: "cascade" }),

		// Payment details
		amount: real("amount").notNull(),
		currency: text("currency").notNull().default("KES"),

		provider: paymentProviderEnum("provider").notNull(),
		providerTransactionId: text("provider_transaction_id"),
		providerFee: real("provider_fee"),

		status: text("status").notNull().default("pending"), // pending, completed, failed
		failureReason: text("failure_reason"),

		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at")
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("payment_invoice_idx").on(table.invoiceId),
		index("payment_status_idx").on(table.status),
		index("payment_provider_tx_idx").on(table.providerTransactionId),
	],
);
