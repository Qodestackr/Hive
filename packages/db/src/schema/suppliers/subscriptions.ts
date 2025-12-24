import { createId } from "@paralleldrive/cuid2";
import {
    index,
    jsonb,
    pgTable,
    real,
    text,
    timestamp,
} from "drizzle-orm/pg-core";
import { organizations } from "../auth/organizations";

export const supplierSubscriptions = pgTable(
    "supplier_subscription",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => createId()),
        organizationId: text("organization_id")
            .notNull()
            .references(() => organizations.id, { onDelete: "cascade" }),

        accessLevel: text("access_level").notNull(),

        brandsAllowed: text("brands_allowed").array(),

        categoriesAllowed: text("categories_allowed").array(),

        subscriptionStatus: text("subscription_status").notNull().default("active"),
        monthlyFee: real("monthly_fee").notNull(),

        currentPeriodStart: timestamp("current_period_start").notNull(),
        currentPeriodEnd: timestamp("current_period_end").notNull(),

        metadata: jsonb("metadata").$type<{
            trialEndsAt?: string;
            canceledAt?: string;
        }>(),

        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at")
            .notNull()
            .defaultNow()
            .$onUpdate(() => new Date()),
    },
    (table) => [
        index("supplier_sub_org_idx").on(table.organizationId),
        index("supplier_sub_status_idx").on(table.subscriptionStatus),
    ],
);

export type SupplierSubscription = typeof supplierSubscriptions.$inferSelect;
export type SupplierSubscriptionInsert =
    typeof supplierSubscriptions.$inferInsert;
