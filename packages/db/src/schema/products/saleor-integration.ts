/**
 * Saleor Integration Schema
 *
 * Tracks Saleor channels and warehouses for multi-tenant setup
 */

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

/**
 * Saleor Channels
 *
 * Each organization gets its own Saleor channel for multi-tenancy
 */
export const saleorChannels = pgTable(
	"saleor_channel",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),

		// Saleor identifiers
		saleorChannelId: text("saleor_channel_id").notNull().unique(), // ID from Saleor
		name: text("name").notNull(), // Channel name in Saleor
		slug: text("slug").notNull().unique(), // Channel slug in Saleor
		currencyCode: text("currency_code").notNull().default("KES"),

		isActive: boolean("is_active").notNull().default(true),

		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at")
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		uniqueIndex("saleor_channel_org_idx").on(table.organizationId),
		uniqueIndex("saleor_channel_saleor_id_idx").on(table.saleorChannelId),
		index("saleor_channel_active_idx").on(table.isActive),
	],
);

/**
 * Warehouses
 *
 * Physical/virtual warehouses linked to organizations
 */
export const warehouses = pgTable(
	"warehouse",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),

		// Saleor identifiers
		saleorWarehouseId: text("saleor_warehouse_id").notNull().unique(),
		name: text("name").notNull(),

		// Address
		address: text("address"),
		city: text("city"),
		country: text("country").default("KE"),
		postalCode: text("postal_code"),

		// Status
		isPrimary: boolean("is_primary").notNull().default(false), // Primary warehouse for this org
		isActive: boolean("is_active").notNull().default(true),

		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at")
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("warehouse_org_idx").on(table.organizationId),
		uniqueIndex("warehouse_saleor_id_idx").on(table.saleorWarehouseId),
		index("warehouse_primary_idx").on(table.isPrimary),
		index("warehouse_active_idx").on(table.isActive),
	],
);
