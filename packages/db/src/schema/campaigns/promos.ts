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
  primaryKey
} from 'drizzle-orm/pg-core';
import { costCalculationMethodEnum, discountTypeEnum } from '../../enums';
import { organizations } from '../auth/organizations';
import { campaigns } from './campaigns';
import { customers } from '../customers/customers';
import { products } from '../products/products';

export const promoCodes = pgTable('promo_code', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  campaignId: text('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
  customerId: text('customer_id').references(() => customers.id, { onDelete: 'cascade' }),
  productId: text('product_id').references(() => products.id, { onDelete: 'set null' }),

  // Code details
  code: text('code').notNull().unique(),
  discountType: discountTypeEnum('discount_type').notNull(),
  discountValue: real('discount_value').notNull(),

  // Redemption tracking
  isRedeemed: boolean('is_redeemed').default(false),
  redeemedAt: timestamp('redeemed_at'),
  saleorOrderId: text('saleor_order_id'), // Link to Saleor order

  // PROFIT INTELLIGENCE AT REDEMPTION (THE GOLD)
  quantityRedeemed: integer('quantity_redeemed').default(1),
  originalPrice: real('original_price'), // Base price before discount
  discountAmount: real('discount_amount'), // Actual discount applied
  netRevenue: real('net_revenue'), // originalPrice - discountAmount
  unitCostAtRedemption: real('unit_cost_at_redemption'), // FIFO cost when redeemed
  totalCOGS: real('total_cogs'), // unitCostAtRedemption * quantityRedeemed
  actualProfit: real('actual_profit'), // netRevenue - totalCOGS
  isProfitable: boolean('is_profitable'), // TRUE if actualProfit > 0

  // AUDIT TRAIL: Freeze the cost calculation method used at redemption
  // Enables profit replay and shows merchants when fallback methods were used (e.g., "⚠️ Estimated" badge)
  costCalculationMethod: costCalculationMethodEnum('cost_calculation_method'),

  // Expiry
  expiresAt: timestamp('expires_at').notNull(),

  // Metadata
  metadata: jsonb('metadata').$type<Record<string, any>>(),

  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('promo_code_idx').on(table.code),
  index('promo_customer_idx').on(table.customerId),
  index('promo_product_idx').on(table.productId),
  index('promo_redeemed_idx').on(table.isRedeemed),
  index('promo_expires_idx').on(table.expiresAt),
  index('promo_profitable_idx').on(table.isProfitable),
  // Composite indexes for analytics
  index('promo_org_redeemed_idx').on(table.organizationId, table.isRedeemed),
  index('promo_redeemed_date_idx').on(table.redeemedAt),
]);

// Type exports - Single source of truth
export type PromoCode = typeof promoCodes.$inferSelect;
export type PromoCodeInsert = typeof promoCodes.$inferInsert;
