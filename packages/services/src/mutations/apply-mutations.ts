/**
 * Mutation Appliers
 * 
 * Impure functions that apply mutation objects to the database.
 * This is the ONLY place that knows about Drizzle ORM specifics.
 */

import type { RedemptionMutations } from './redemption-mutations';
import type { StockArrivalMutations, ReconciliationMutations, CorrectionMutations } from './stock-mutations';
import type { CustomerUpdateMutations, OptInMutations, OptOutMutations, AgeVerificationMutations } from './customer-mutations';
import type { ProductUpdateMutations, PriceUpdateMutations } from './product-mutations';
import {
    promoCodes,
    inventoryMovements,
    products,
    campaigns,
    customers,
    purchaseOrders,
    purchaseOrderItems,
    reconciliationLogs,
    promoProfitAlerts,
    eq,
    sql,
} from '@repo/db';

/**
 * Apply redemption mutations to database (IMPURE FUNCTION)
 * 
 * Takes mutation objects and applies them using Drizzle ORM.
 * This is the only function that knows about database specifics.
 * 
 * @param tx - Drizzle transaction object
 * @param mutations - Mutation objects from buildRedemptionMutations
 */
export async function applyRedemptionMutations(
    tx: any, // Drizzle transaction type
    mutations: RedemptionMutations
): Promise<void> {
    // 1. Update promo code
    await tx
        .update(promoCodes)
        .set(mutations.promoCodeUpdate)
        .where(eq(promoCodes.id, mutations.promoCodeUpdate.id));

    // 2. Insert inventory movement
    await tx
        .insert(inventoryMovements)
        .values(mutations.inventoryMovement);

    // 3. Update product stock
    await tx
        .update(products)
        .set({
            currentStockQuantity: mutations.productUpdate.currentStockQuantity,
            updatedAt: mutations.productUpdate.updatedAt,
        })
        .where(eq(products.id, mutations.productUpdate.id));

    // 4. Update campaign (if mutation exists)
    if (mutations.campaignUpdate) {
        await tx
            .update(campaigns)
            .set(mutations.campaignUpdate)
            .where(eq(campaigns.id, mutations.campaignUpdate.id));
    }

    // 5. Update customer (if mutation exists)
    if (mutations.customerUpdate) {
        await tx
            .update(customers)
            .set({
                totalSpend: sql`${customers.totalSpend} + ${mutations.customerUpdate.totalSpendIncrement}`,
                attributedRevenue: sql`${customers.attributedRevenue} + ${mutations.customerUpdate.attributedRevenueIncrement}`,
                totalOrders: sql`${customers.totalOrders} + ${mutations.customerUpdate.totalOrdersIncrement}`,
                lastOrderAt: mutations.customerUpdate.lastOrderAt,
                updatedAt: mutations.customerUpdate.updatedAt,
            })
            .where(eq(customers.id, mutations.customerUpdate.id));
    }
}

export async function applyStockArrivalMutations(
    tx: any,
    mutations: StockArrivalMutations
): Promise<void> {
    await tx.insert(purchaseOrders).values(mutations.purchaseOrder);
    await tx.insert(purchaseOrderItems).values(mutations.purchaseOrderItem);
    await tx.insert(inventoryMovements).values(mutations.inventoryMovement);
    await tx.update(products)
        .set(mutations.productUpdate)
        .where(eq(products.id, mutations.productUpdate.id));
}

export async function applyReconciliationMutations(
    tx: any,
    mutations: ReconciliationMutations
): Promise<void> {
    await tx.insert(reconciliationLogs).values(mutations.reconciliationLog);
    await tx.insert(promoProfitAlerts).values(mutations.alert);
}

export async function applyCorrectionMutations(
    tx: any,
    mutations: CorrectionMutations
): Promise<void> {
    await tx.insert(inventoryMovements).values(mutations.inventoryMovement);
    await tx.update(reconciliationLogs)
        .set(mutations.reconciliationLogUpdate)
        .where(eq(reconciliationLogs.id, mutations.reconciliationLogUpdate.id));
}

export async function applyCustomerUpdateMutations(
    tx: any,
    mutations: CustomerUpdateMutations | OptInMutations | OptOutMutations | AgeVerificationMutations
): Promise<void> {
    await tx.update(customers)
        .set(mutations.customerUpdate)
        .where(eq(customers.id, mutations.customerUpdate.id));
}

export async function applyProductUpdateMutations(
    tx: any,
    mutations: ProductUpdateMutations | PriceUpdateMutations
): Promise<void> {
    await tx.update(products)
        .set(mutations.productUpdate)
        .where(eq(products.id, mutations.productUpdate.id));
}
