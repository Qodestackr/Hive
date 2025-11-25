/**
 * FIFO (First-In, First-Out) Service
 * 
 * Core profit intelligence engine. Tracks inventory costs using FIFO method.
 * This is THE GOLD - without accurate FIFO costs, profit calculation collapses.
 */

import db, {
    withDbOperation,
    withDrizzleErrors,
    eq, and, sql, desc,
    purchaseOrderItems,
    products,
    inventoryMovements
} from "@repo/db";
import { createError } from "@repo/utils";
import { Effect } from "effect";
import {
    ProductNotFound,
    InsufficientInventory,
    NoCostData,
    type DatabaseError,
} from "@repo/utils/errors/domain";
import { OrganizationContext } from "@repo/utils";

import { ProductFIFOBatchesResponse } from "@repo/schema";

/**
 * FIFO Calculation Result
 * Tracks which method was used to calculate unit cost
 */
interface FIFOCalculationResult {
    method: 'fifo' | 'weighted_average' | 'fallback';
    unitCost: number;
    batchId?: string; // Only present when method is 'fifo'
    batchNumber?: string | null;
    expiryDate?: string | null;
}

export const fifoService = {
    /**
     * Effect-based FIFO batch lookup 
     * 
     * Returns typed errors instead of throws.
     * Gets organizationId from context - no prop drilling!
     */
    getOldestAvailableBatchEffect(
        productId: string,
        quantity: number
    ): Effect.Effect<
        FIFOCalculationResult,
        ProductNotFound | InsufficientInventory | NoCostData | DatabaseError,
        OrganizationContext
    > {
        return Effect.gen(function* () {
            // Get organizationId from context
            const { organizationId } = yield* OrganizationContext;
            // Get all batches for product
            const batches = yield* withDrizzleErrors(
                "purchase_order_item",
                "query",
                async () => {
                    const quantityUsedSubquery = db
                        .select({
                            batchId: inventoryMovements.fifoBatchId,
                            totalUsed: sql<number>`COALESCE(SUM(ABS(${inventoryMovements.quantity})), 0)`.as('total_used')
                        })
                        .from(inventoryMovements)
                        .where(
                            and(
                                eq(inventoryMovements.productId, productId),
                                eq(inventoryMovements.organizationId, organizationId),
                                sql`${inventoryMovements.quantity} < 0`
                            )
                        )
                        .groupBy(inventoryMovements.fifoBatchId)
                        .as('used');

                    return await db
                        .select({
                            id: purchaseOrderItems.id,
                            productId: purchaseOrderItems.productId,
                            quantityOrdered: purchaseOrderItems.quantityOrdered,
                            quantityReceived: purchaseOrderItems.quantityReceived,
                            unitCost: purchaseOrderItems.unitCost,
                            batchNumber: purchaseOrderItems.batchNumber,
                            expiryDate: purchaseOrderItems.expiryDate,
                            createdAt: purchaseOrderItems.createdAt,
                            quantityUsed: sql<number>`COALESCE(${quantityUsedSubquery.totalUsed}, 0)`.as('quantity_used')
                        })
                        .from(purchaseOrderItems)
                        .leftJoin(quantityUsedSubquery, eq(purchaseOrderItems.id, quantityUsedSubquery.batchId))
                        .where(eq(purchaseOrderItems.productId, productId))
                        .orderBy(purchaseOrderItems.createdAt);
                }
            );

            // FAIL-SAFE: No batches → use weighted average
            if (batches.length === 0) {
                const productRows = yield* withDrizzleErrors(
                    "product",
                    "findUnique",
                    () => db
                        .select()
                        .from(products)
                        .where(and(
                            eq(products.id, productId),
                            eq(products.organizationId, organizationId)
                        ))
                        .limit(1)
                );

                const product = productRows[0];
                if (!product) {
                    return yield* Effect.fail(new ProductNotFound({ productId, organizationId }));
                }

                const fallbackCost = product.currentFIFOCost || 0;
                if (fallbackCost === 0) {
                    return yield* Effect.fail(new NoCostData({ productId, organizationId }));
                }

                return {
                    method: 'weighted_average' as const,
                    unitCost: fallbackCost
                };
            }

            // Find first batch with sufficient stock
            for (const batch of batches) {
                const quantityRemaining = (batch.quantityReceived ?? 0) - (batch.quantityUsed ?? 0);
                if (quantityRemaining >= quantity) {
                    return {
                        method: 'fifo' as const,
                        unitCost: batch.unitCost,
                        batchId: batch.id,
                        batchNumber: batch.batchNumber,
                        expiryDate: batch.expiryDate ? new Date(batch.expiryDate).toISOString() : null
                    };
                }
            }

            // Calculate total available and fail
            const totalAvailable = batches.reduce((sum, b) => {
                const received = b.quantityReceived ?? 0;
                const used = b.quantityUsed ?? 0;
                return sum + (received - used);
            }, 0);

            return yield* Effect.fail(new InsufficientInventory({
                productId,
                requested: quantity,
                available: totalAvailable
            }));
        });
    },

    /**
     * Calculate weighted average FIFO cost for a product
     * 
     * Used when updating product.currentFIFOCost after stock movements.
     * Formula: Sum(batchCost * remainingQty) / Sum(remainingQty)
     * 
     * @param productId - Product to calculate cost for
     * @param organizationId - Organization context
     * @returns Weighted average FIFO cost
     */
    async calculateWeightedAverageCost(
        productId: string,
        organizationId: string
    ): Promise<number> {
        const batches = await withDbOperation({
            operation: "query",
            table: "purchase_order_item",
            context: { organizationId, productId }
        }, async () => {
            const quantityUsedSubquery = db
                .select({
                    batchId: inventoryMovements.fifoBatchId,
                    totalUsed: sql<number>`COALESCE(SUM(ABS(${inventoryMovements.quantity})), 0)`.as('total_used')
                })
                .from(inventoryMovements)
                .where(
                    and(
                        eq(inventoryMovements.productId, productId),
                        eq(inventoryMovements.organizationId, organizationId),
                        sql`${inventoryMovements.quantity} < 0`
                    )
                )
                .groupBy(inventoryMovements.fifoBatchId)
                .as('used');

            const result = await db
                .select({
                    unitCost: purchaseOrderItems.unitCost,
                    quantityReceived: purchaseOrderItems.quantityReceived,
                    quantityUsed: sql<number>`COALESCE(${quantityUsedSubquery.totalUsed}, 0)`.as('quantity_used')
                })
                .from(purchaseOrderItems)
                .leftJoin(quantityUsedSubquery, eq(purchaseOrderItems.id, quantityUsedSubquery.batchId))
                .where(eq(purchaseOrderItems.productId, productId));

            return result;
        });

        if (batches.length === 0) {
            return 0; // No batches = no cost
        }

        // Filter out batches with null quantityReceived and ensure type safety
        const validBatches = batches
            .filter(b => b.quantityReceived !== null)
            .map(b => ({
                unitCost: b.unitCost,
                quantityReceived: b.quantityReceived!,
                quantityUsed: b.quantityUsed
            }));

        const { StockCalculator } = await import("./calculators/stock-calculator");
        return StockCalculator.calculateWeightedAverageCost({ batches: validBatches });
    },

    /**
     * Get all FIFO batches for a product (transparency/audit trail)
     * 
     * Shows batch-level cost tracking for accounting and verification.
     * 
     * @param productId - Product to get batches for
     * @param organizationId - Organization context
     * @returns Product details with batch breakdown
     */
    async getFIFOBatchesForProduct(
        productId: string,
        organizationId: string
    ): Promise<ProductFIFOBatchesResponse> {
        // Get product details
        const product = await withDbOperation({
            operation: "findUnique",
            table: "product",
            context: { organizationId, productId }
        }, () => db
            .select()
            .from(products)
            .where(and(
                eq(products.id, productId),
                eq(products.organizationId, organizationId)
            ))
            .limit(1)
            .then(rows => rows[0])
        );

        if (!product) {
            throw createError.notFound("Product", { productId, organizationId });
        }

        // Get batches with remaining quantities
        const batches = await withDbOperation({
            operation: "query",
            table: "purchase_order_item",
            context: { organizationId, productId }
        }, async () => {
            const quantityUsedSubquery = db
                .select({
                    batchId: inventoryMovements.fifoBatchId,
                    totalUsed: sql<number>`COALESCE(SUM(ABS(${inventoryMovements.quantity})), 0)`.as('total_used')
                })
                .from(inventoryMovements)
                .where(
                    and(
                        eq(inventoryMovements.productId, productId),
                        eq(inventoryMovements.organizationId, organizationId),
                        sql`${inventoryMovements.quantity} < 0`
                    )
                )
                .groupBy(inventoryMovements.fifoBatchId)
                .as('used');

            const result = await db
                .select({
                    id: purchaseOrderItems.id,
                    productId: purchaseOrderItems.productId,
                    quantityOrdered: purchaseOrderItems.quantityOrdered,
                    quantityReceived: purchaseOrderItems.quantityReceived,
                    unitCost: purchaseOrderItems.unitCost,
                    batchNumber: purchaseOrderItems.batchNumber,
                    expiryDate: purchaseOrderItems.expiryDate,
                    createdAt: purchaseOrderItems.createdAt,
                    quantityUsed: sql<number>`COALESCE(${quantityUsedSubquery.totalUsed}, 0)`.as('quantity_used')
                })
                .from(purchaseOrderItems)
                .leftJoin(quantityUsedSubquery, eq(purchaseOrderItems.id, quantityUsedSubquery.batchId))
                .where(eq(purchaseOrderItems.productId, productId))
                .orderBy(desc(purchaseOrderItems.createdAt)); // Newest first for display

            return result;
        });

        return {
            productId: product.id,
            productName: product.name,
            currentFIFOCost: product.currentFIFOCost,
            totalStockQuantity: product.currentStockQuantity || 0,
            batches: batches.map(b => ({
                batchId: b.id,
                productId: b.productId,
                unitCost: b.unitCost,
                quantityRemaining: (b.quantityReceived ?? 0) - b.quantityUsed,
                purchaseDate: new Date(b.createdAt).toISOString(),
                batchNumber: b.batchNumber,
                expiryDate: b.expiryDate ? new Date(b.expiryDate).toISOString() : null,
            }))
        };
    }
};
