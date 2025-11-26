import { createId } from '@paralleldrive/cuid2';
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  real,
  jsonb,
  pgEnum,
  uniqueIndex,
  index,
  primaryKey
} from 'drizzle-orm/pg-core';
import { organizations } from '../auth/organizations';
import { campaignStatusEnum, campaignTypeEnum } from '../../enums';

// core engine
export const campaigns = pgTable('campaign', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),

  // Campaign details
  name: text('name').notNull(),
  type: campaignTypeEnum('type').notNull(),
  status: campaignStatusEnum('status').notNull().default('draft'),

  // Messaging
  messageTemplate: text('message_template').notNull(), // Template with {{variables}}
  platforms: jsonb('platforms').$type<('whatsapp' | 'sms' | 'email')[]>().default(['whatsapp']),

  // Targeting
  targetSegment: jsonb('target_segment').$type<{
    tiers?: string[];
    minSpend?: number;
    cities?: string[];
    tags?: string[];
    lastOrderDaysAgo?: number;
  }>(),
  targetRadius: real('target_radius'), // Km from location
  targetProductIds: jsonb('target_product_ids').$type<string[]>(), // Inventory-aware targeting

  // Offer configuration
  offerType: text('offer_type').notNull(), // 'percentage_discount', 'fixed_discount', 'buy_x_get_y', 'free_delivery'
  offerValue: real('offer_value'), // e.g., 20 for 20% off
  minPurchaseAmount: real('min_purchase_amount'),

  // PROFIT INTELLIGENCE: Pre-flight simulation
  estimatedFIFOCost: real('estimated_fifo_cost'), // Current FIFO cost at campaign creation
  estimatedProfitPerRedemption: real('estimated_profit_per_redemption'), // Projected profit
  minProfitThreshold: real('min_profit_threshold'), // Don't auto-approve if below this

  // Promo code integration (Saleor)
  saleorVoucherCode: text('saleor_voucher_code'), // Link to Saleor voucher
  maxRedemptions: integer('max_redemptions'),
  redemptionsUsed: integer('redemptions_used').default(0),

  // Scheduling
  scheduledFor: timestamp('scheduled_for'),
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at'),

  // Performance tracking (OUTCOME METRICS)
  sent: integer('sent').default(0),
  delivered: integer('delivered').default(0),
  opened: integer('opened').default(0),
  clicked: integer('clicked').default(0),

  // THE NORTH STAR METRIC
  capturesCount: integer('captures_count').default(0), // New verified phone numbers

  conversions: integer('conversions').default(0),
  revenue: real('revenue').default(0),
  discountCost: real('discount_cost').default(0),

  // TRUE PROFIT (revenue - discountCost - COGS)
  totalCOGS: real('total_cogs').default(0), // Sum of unitCostAtRedemption from all promo codes
  actualProfit: real('actual_profit').default(0), // revenue - discountCost - totalCOGS
  avgProfitPerRedemption: real('avg_profit_per_redemption'), // actualProfit / conversions

  // Warning flags
  isLosingMoney: boolean('is_losing_money').default(false), // TRUE if actualProfit < 0

  // Budget
  budgetAmount: real('budget_amount'),
  spentAmount: real('spent_amount').default(0),

  // PROFIT ALERT SYSTEM: Auto-pause protection
  autoPauseEnabled: boolean('auto_pause_enabled').default(true), // Toggle auto-pause when profit drops
  pauseThreshold: real('pause_threshold').default(10.0), // Profit margin % threshold (e.g., 10%)
  notificationsEnabled: boolean('notifications_enabled').default(true), // Send alerts to distributor
  alertCheckInterval: integer('alert_check_interval').default(300), // Seconds between checks (default 5min)

  // Metadata
  metadata: jsonb('metadata').$type<Record<string, any>>(),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index('campaign_org_idx').on(table.organizationId),
  index('campaign_status_idx').on(table.status),
  index('campaign_scheduled_idx').on(table.scheduledFor),
  // Composite indexes for common queries
  index('campaign_org_status_idx').on(table.organizationId, table.status),
  index('campaign_scheduled_status_idx').on(table.scheduledFor, table.status),
]);

// Type exports - Single source of truth
export type Campaign = typeof campaigns.$inferSelect;
export type CampaignInsert = typeof campaigns.$inferInsert;