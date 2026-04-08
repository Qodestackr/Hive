import { createId } from "@paralleldrive/cuid2";
import {
    index,
    integer,
    jsonb,
    pgTable,
    real,
    text,
    timestamp,
    uniqueIndex,
} from "drizzle-orm/pg-core";
import { brands } from "../products/brands";

export const supplierMarketIntel = pgTable(
    "supplier_market_intel",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => createId()),
        brandId: text("brand_id")
            .notNull()
            .references(() => brands.id),
        region: text("region").notNull(),
        periodStart: timestamp("period_start").notNull(),
        periodEnd: timestamp("period_end").notNull(),

        totalVolume: integer("total_volume").notNull().default(0),
        totalRevenue: real("total_revenue").notNull().default(0),
        avgMargin: real("avg_margin"),

        marketPosition: integer("market_position"),
        trendDirection: text("trend_direction"),
        momGrowth: real("mom_growth"),

        competitorComparison: jsonb("competitor_comparison").$type<
            {
                brandId: string;
                brandName: string;
                volumeDiff: number;
                marginDiff: number;
            }[]
        >(),

        segmentBreakdown: jsonb("segment_breakdown").$type<{
            premium: number;
            midTier: number;
            value: number;
        }>(),

        geoBreakdown: jsonb("geo_breakdown").$type<
            {
                location: string;
                percentage: number;
            }[]
        >(),

        createdAt: timestamp("created_at").notNull().defaultNow(),
    },
    (table) => [
        index("market_intel_brand_idx").on(table.brandId),
        index("market_intel_region_idx").on(table.region),
        index("market_intel_period_idx").on(table.periodStart, table.periodEnd),
        uniqueIndex("market_intel_unique_idx").on(
            table.brandId,
            table.region,
            table.periodStart,
            table.periodEnd,
        ),
    ],
);

export type SupplierMarketIntel = typeof supplierMarketIntel.$inferSelect;
export type SupplierMarketIntelInsert = typeof supplierMarketIntel.$inferInsert;
