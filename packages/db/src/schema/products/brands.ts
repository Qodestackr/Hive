import { createId } from "@paralleldrive/cuid2";
import {
    boolean,
    index,
    jsonb,
    pgTable,
    text,
    timestamp,
} from "drizzle-orm/pg-core";

export const brands = pgTable(
    "brand",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => createId()),
        name: text("name").notNull(),
        slug: text("slug").notNull().unique(),
        category: text("category").notNull(),
        parentCompany: text("parent_company"),

        metadata: jsonb("metadata").$type<{
            logo?: string;
            description?: string;
        }>(),

        isActive: boolean("is_active").default(true),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at")
            .notNull()
            .defaultNow()
            .$onUpdate(() => new Date()),
    },
    (table) => [
        index("brand_category_idx").on(table.category),
        index("brand_parent_company_idx").on(table.parentCompany),
    ],
);

export type Brand = typeof brands.$inferSelect;
export type BrandInsert = typeof brands.$inferInsert;
