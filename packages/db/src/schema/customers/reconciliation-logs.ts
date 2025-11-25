import { createId } from '@paralleldrive/cuid2';
import {
    pgTable,
    text,
    timestamp,
    index,
    integer,
    boolean
} from 'drizzle-orm/pg-core';
import { organizations } from '../auth/organizations';
import { products } from '../products/products';

/**
 * Reconciliation Logs
 * 
 * THE TRUST ENGINE.
 * 
 * Why this exists:
 * When trust breaks, you need to know why. If a merchant asks "Why did you tell me I made 50k 
 * when I actually made 30k?", you need to replay the exact state of the ledger.
 * 
 * This table is the defense. It records the nightly comparison between the immutable ledger 
 * (inventory_movements) and the physical reality (product.current_stock_quantity).
 * 
 * If they diverge, we have a timestamped record of when and by how much, allowing us to 
 * debug backward to find the exact moment the FIFO chain or data integrity broke.
 */
export const reconciliationLogs = pgTable('reconciliation_log', {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),

    // Reconciliation details
    expectedQuantity: integer('expected_quantity').notNull(), // Sum of all movements (The Ledger)
    actualQuantity: integer('actual_quantity').notNull(), // product.current_stock_quantity (The Reality)
    discrepancy: integer('discrepancy').notNull(), // expected - actual

    // Resolution
    isResolved: boolean('is_resolved').default(false),
    resolvedAt: timestamp('resolved_at'),
    resolutionNotes: text('resolution_notes'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
    index('reconciliation_log_org_idx').on(table.organizationId),
    index('reconciliation_log_product_idx').on(table.productId),
    index('reconciliation_log_unresolved_idx').on(table.isResolved),
]);

/**
NOTES: cost_calculation_method field added to promo_code table
 * 
 * The promoCodes table includes a `costCalculationMethod` enum field that freezes 
 * which method (FIFO | weighted_average | fallback) was used at redemption time.
 * 
 * This enables:
 * - Accurate profit replay for any historical redemption
 * - Transparent fallback tracking (shows "⚠️ Estimated" badge when FIFO chain broke)
 * - Prevention of "you lied about my profit" disputes through provable audit trails
 * 
 * See: packages/db/src/schema/campaigns/promos.ts
 */