import { createId } from "@paralleldrive/cuid2";
import {
	boolean,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	primaryKey,
	real,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { businessTypeEnum, subscriptionStatusEnum } from "../../enums";

export const organizations = pgTable(
	"organization",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		name: text("name").notNull(),
		slug: text("slug").notNull().unique(),

		// Better Auth standard fields
		logo: text("logo"), // Organization logo URL
		metadata: jsonb("metadata").$type<Record<string, any>>(), // Flexible metadata storage

		// Business profile
		businessType: businessTypeEnum("business_type")
			.notNull()
			.default("retailer"),
		licenseNumber: text("license_number"),
		taxId: text("tax_id"),
		phoneNumber: text("phone_number"),

		// Subscription & Pricing (GRANDFATHERED MODEL)
		subscriptionStatus: subscriptionStatusEnum("subscription_status")
			.notNull()
			.default("trialing"),
		pricingVersion: text("pricing_version").notNull(), // "v1_200", "v2_250" etc
		joinedAt: timestamp("joined_at").notNull().defaultNow(),
		basePrice: real("base_price").notNull(), // Monthly base fee (KES)

		// Outcome-based pricing config
		outcomeBasePer1000Captures: real("outcome_base_per_1000_captures").default(
			0,
		), // Extra charge per 1K captures
		outcomeProfitSharePercent: real("outcome_profit_share_percent").default(0), // % of campaign profit

		// User limits (for distributors)
		maxUsers: integer("max_users").default(1),
		includedUsers: integer("included_users").default(1),
		additionalUserPrice: real("additional_user_price").default(0),

		// Trial tracking
		trialEndsAt: timestamp("trial_ends_at"),

		// Integrations
		saleorChannelId: text("saleor_channel_id"), // Link to Saleor headless commerce
		odooCompanyId: text("odoo_company_id"), // Optional Odoo integration

		// Metadata
		settings: jsonb("settings").$type<{
			enableSMS?: boolean;
			defaultCampaignLanguage?: string;
			complianceSettings?: {
				requireAgeVerification: boolean;
				minimumAge: number;
			};
		}>(),

		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at")
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		uniqueIndex("org_slug_idx").on(table.slug),
		index("org_business_type_idx").on(table.businessType),
		index("org_subscription_status_idx").on(table.subscriptionStatus),
	],
);

export type Organization = typeof organizations.$inferSelect;
