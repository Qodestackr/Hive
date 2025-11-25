import { createId } from '@paralleldrive/cuid2';
import {
  pgTable,
  text,
  timestamp,
  integer,
  real,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { organizations } from '../auth/organizations';
import { products } from './products';
import { purchaseOrderItems } from './purchase-orders';
import { campaigns } from '../campaigns/campaigns';
import { promoCodes } from '../campaigns/promos';

export const inventoryMovements = pgTable('inventory_movement', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),

  // Movement details
  movementType: text('movement_type').notNull(),
  quantity: integer('quantity').notNull(),

  // FIFO cost tracking (THE KEY TO PROFIT CALCULATION)
  unitCostAtMovement: real('unit_cost_at_movement').notNull(),
  totalCost: real('total_cost').notNull(),

  // FIFO batch tracking
  fifoBatchId: text('fifo_batch_id').references(() => purchaseOrderItems.id),

  // References (what triggered this movement)
  referenceType: text('reference_type'),
  referenceId: text('reference_id'),
  campaignId: text('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
  promoCodeId: text('promo_code_id').references(() => promoCodes.id, { onDelete: 'set null' }),

  // Stock levels after movement
  stockAfterMovement: integer('stock_after_movement').notNull(),

  // Metadata
  notes: text('notes'),
  metadata: jsonb('metadata').$type<Record<string, any>>(),

  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('inventory_movement_org_idx').on(table.organizationId),
  index('inventory_movement_product_idx').on(table.productId),
  index('inventory_movement_type_idx').on(table.movementType),
  index('inventory_movement_campaign_idx').on(table.campaignId),
  index('inventory_movement_promo_code_idx').on(table.promoCodeId),
  index('inventory_movement_created_idx').on(table.createdAt),
  // Composite indexes for common query patterns
  index('inventory_movement_product_date_idx').on(table.productId, table.createdAt),
  index('inventory_movement_org_type_idx').on(table.organizationId, table.movementType),
]);