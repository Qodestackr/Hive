import { createId } from '@paralleldrive/cuid2';
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  real,
  index,
} from 'drizzle-orm/pg-core';
import { organizations } from '../auth/organizations';
import { campaigns } from '../campaigns/campaigns';
import { products } from './products';

export const promoProfitAlerts = pgTable('promo_profit_alert', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  campaignId: text('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  productId: text('product_id').references(() => products.id, { onDelete: 'set null' }),

  // Alert details
  alertType: text('alert_type').notNull(),
  severity: text('severity').notNull(),
  message: text('message').notNull(),

  // Context
  currentFIFOCost: real('current_fifo_cost'),
  discountPercent: real('discount_percent'),
  redemptionsCount: integer('redemptions_count'),
  totalLoss: real('total_loss'),
  estimatedLossPerRedemption: real('estimated_loss_per_redemption'),

  // Actions
  isResolved: boolean('is_resolved').default(false),
  actionTaken: text('action_taken'),
  resolvedAt: timestamp('resolved_at'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('promo_profit_alert_org_idx').on(table.organizationId),
  index('promo_profit_alert_campaign_idx').on(table.campaignId),
  index('promo_profit_alert_severity_idx').on(table.severity),
  index('promo_profit_alert_resolved_idx').on(table.isResolved),
]);
