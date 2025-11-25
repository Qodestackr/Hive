import { createId } from '@paralleldrive/cuid2';
import {
  pgTable,
  text,
  timestamp,
  boolean,
  real,
  index,
} from 'drizzle-orm/pg-core';
import { platformEnum } from '../../enums';
import { campaigns } from './campaigns';
import { customers } from '../customers/customers';

// Engagement tracking
export const campaignResponses = pgTable('campaign_response', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  campaignId: text('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  customerId: text('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),

  // Response details
  platform: platformEnum('platform').notNull(),
  messageBody: text('message_body'),

  // Conversion tracking
  isConverted: boolean('is_converted').default(false),
  orderValue: real('order_value'),
  promoCodeUsed: text('promo_code_used'),
  saleorOrderId: text('saleor_order_id'), // Link to Saleor order

  respondedAt: timestamp('responded_at').notNull().defaultNow(),
}, (table) => [
  index('response_campaign_idx').on(table.campaignId),
  index('response_customer_idx').on(table.customerId),
  index('response_converted_idx').on(table.isConverted),
]);
