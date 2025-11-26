import { createId } from '@paralleldrive/cuid2';
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  real,
  jsonb,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { organizations } from '../auth/organizations';

export const products = pgTable('product', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),

  // Product details
  name: text('name').notNull(),
  sku: text('sku').notNull(),
  category: text('category'),
  description: text('description'),

  // Saleor integration (SOURCE OF TRUTH)
  saleorProductId: text('saleor_product_id'),
  saleorVariantId: text('saleor_variant_id'),
  saleorChannelId: text('saleor_channel_id'),

  // Pricing (from Saleor, synced)
  basePrice: real('base_price').notNull(),

  // Current inventory intelligence (calculated fields)
  currentFIFOCost: real('current_fifo_cost'),
  currentStockQuantity: integer('current_stock_quantity').default(0),
  reorderPoint: integer('reorder_point').default(0),
  leadTimeDays: integer('lead_time_days').default(7),

  // Compliance (for alcohol)
  alcoholContent: real('alcohol_content'),
  requiresAgeVerification: boolean('requires_age_verification').default(true),

  // AI intelligence
  isSlowMover: boolean('is_slow_mover').default(false),
  avgMarginPercent: real('avg_margin_percent'),

  // Metadata
  images: jsonb('images').$type<string[]>(),
  tags: jsonb('tags').$type<string[]>().default([]),

  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex('product_org_sku_idx').on(table.organizationId, table.sku),
  index('product_saleor_product_idx').on(table.saleorProductId),
  index('product_saleor_variant_idx').on(table.saleorVariantId),
  index('product_category_idx').on(table.category),
]);

// Type exports - Single source of truth
export type Product = typeof products.$inferSelect;
export type ProductInsert = typeof products.$inferInsert;