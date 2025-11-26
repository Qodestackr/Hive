import { createId } from "@paralleldrive/cuid2";
import {
	boolean,
	index,
	integer,
	jsonb,
	pgTable,
	primaryKey,
	real,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { verificationMethodEnum } from "../../enums";
import { organizations } from "../auth/organizations";

// ============================================================================
// CUSTOMERS (THE GOLD: Verified Phone Numbers)
// ============================================================================
export const customers = pgTable(
	"customer",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),

		// Identity
		phoneNumber: text("phone_number").notNull(), // E.164 format (+254...)
		name: text("name"),
		email: text("email"),

		// Age Verification (COMPLIANCE GOLD)
		isAgeVerified: boolean("is_age_verified").notNull().default(false),
		ageVerificationMethod: verificationMethodEnum("age_verification_method"),
		ageVerifiedAt: timestamp("age_verified_at"),
		dateOfBirth: timestamp("date_of_birth"), // Optional, from ID upload

		// Opt-in tracking (REGULATORY MOAT)
		hasOptedIn: boolean("has_opted_in").notNull().default(false),
		optInSource: text("opt_in_source"), // 'whatsapp_campaign', 'in_store_signup', 'social_ad'
		optInCampaignId: text("opt_in_campaign_id"), // Which campaign captured them
		optedInAt: timestamp("opted_in_at"),
		optedOutAt: timestamp("opted_out_at"),

		// Segmentation
		tier: text("tier").default("bronze"), // bronze, silver, gold, platinum
		totalSpend: real("total_spend").default(0),

		// LTV ATTRIBUTION (GLOBAL CUSTOMER METRIC)
		//
		// Tracks revenue from ALL promo redemptions this customer has made across ALL campaigns.
		// This accumulates over the customer's lifetime, regardless of which campaigns they participated in.
		//
		// USE CASE: Customer profile displays ("Total value generated through Promco")
		// DO NOT USE FOR: Campaign-specific LTV analysis (query promoCodes table instead)
		//
		// Example:
		// - Customer redeems from Campaign A → KES 4,500
		// - Later redeems from Campaign B → KES 6,000
		// - attributedRevenue = 10,500 (global total)
		// - Campaign A LTV = 4,500 (from promoCodes table)
		// - Campaign B LTV = 6,000 (from promoCodes table)
		attributedRevenue: real("attributed_revenue").default(0),

		totalOrders: integer("total_orders").default(0),
		lastOrderAt: timestamp("last_order_at"),

		// Location (for geo-targeted campaigns)
		city: text("city"),
		coordinates: jsonb("coordinates").$type<{ lat: number; lng: number }>(),

		// Metadata
		tags: jsonb("tags").$type<string[]>().default([]), // ['loyal', 'high_value', 'liquor_buyer']
		customFields: jsonb("custom_fields").$type<Record<string, any>>(),

		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at")
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		uniqueIndex("customer_phone_org_idx").on(
			table.phoneNumber,
			table.organizationId,
		),
		index("customer_org_idx").on(table.organizationId),
		index("customer_opt_in_idx").on(table.hasOptedIn),
		index("customer_age_verified_idx").on(table.isAgeVerified),
	],
);
