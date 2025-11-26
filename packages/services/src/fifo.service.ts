/**
 * FIFO (First-In, First-Out) Service
 *
 * Core profit intelligence engine. Tracks inventory costs using FIFO method.
 * This is THE GOLD - without accurate FIFO costs, profit calculation collapses.
 */

import db, {
	and,
	desc,
	eq,
	inventoryMovements,
	products,
	purchaseOrderItems,
	sql,
	withDbOperation,
	withDrizzleErrors,
} from "@repo/db";
import type { ProductFIFOBatchesResponse } from "@repo/schema";
import { createError, OrganizationContext } from "@repo/utils";
import {
	type DatabaseError,
	InsufficientInventory,
	NoCostData,
	ProductNotFound,
} from "@repo/utils/errors/domain";
import { Effect } from "effect";
import { StockCalculator } from "./calculators/stock-calculator";

/**
 * FIFO Calculation Result
 * Tracks which method was used to calculate unit cost
 */
interface FIFOCalculationResult {
	method: "fifo" | "weighted_average" | "fallback";
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
		quantity: number,
	): Effect.Effect<
		FIFOCalculationResult,
		ProductNotFound | InsufficientInventory | NoCostData | DatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;
			const batches = yield* withDrizzleErrors(
				"purchase_order_item",
				"query",
				async () => {
					const quantityUsedSubquery = db
						.select({
							batchId: inventoryMovements.fifoBatchId,
							totalUsed:
								sql<number>`COALESCE(SUM(ABS(${inventoryMovements.quantity})), 0)`.as(
									"total_used",
								),
						})
						.from(inventoryMovements)
						.where(
							and(
								eq(inventoryMovements.productId, productId),
								eq(inventoryMovements.organizationId, organizationId),
								sql`${inventoryMovements.quantity} < 0`,
							),
						)
						.groupBy(inventoryMovements.fifoBatchId)
						.as("used");

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
							quantityUsed:
								sql<number>`COALESCE(${quantityUsedSubquery.totalUsed}, 0)`.as(
									"quantity_used",
								),
						})
						.from(purchaseOrderItems)
						.leftJoin(
							quantityUsedSubquery,
							eq(purchaseOrderItems.id, quantityUsedSubquery.batchId),
						)
						.where(eq(purchaseOrderItems.productId, productId))
						.orderBy(purchaseOrderItems.createdAt);
				},
			);

			// FAIL-SAFE: No batches → use weighted average
			if (batches.length === 0) {
				const productRows = yield* withDrizzleErrors(
					"product",
					"findUnique",
					() =>
						db
							.select()
							.from(products)
							.where(
								and(
									eq(products.id, productId),
									eq(products.organizationId, organizationId),
								),
							)
							.limit(1),
				);

				const product = productRows[0];
				if (!product) {
					return yield* Effect.fail(
						new ProductNotFound({ productId, organizationId }),
					);
				}

				const fallbackCost = product.currentFIFOCost || 0;
				if (fallbackCost === 0) {
					return yield* Effect.fail(
						new NoCostData({ productId, organizationId }),
					);
				}

				return {
					method: "weighted_average" as const,
					unitCost: fallbackCost,
				};
			}

			// Find first batch with sufficient stock
			for (const batch of batches) {
				const quantityRemaining =
					(batch.quantityReceived ?? 0) - (batch.quantityUsed ?? 0);
				if (quantityRemaining >= quantity) {
					return {
						method: "fifo" as const,
						unitCost: batch.unitCost,
						batchId: batch.id,
						batchNumber: batch.batchNumber,
						expiryDate: batch.expiryDate
							? new Date(batch.expiryDate).toISOString()
							: null,
					};
				}
			}

			const totalAvailable = batches.reduce((sum, b) => {
				const received = b.quantityReceived ?? 0;
				const used = b.quantityUsed ?? 0;
				return sum + (received - used);
			}, 0);

			return yield* Effect.fail(
				new InsufficientInventory({
					productId,
					requested: quantity,
					available: totalAvailable,
				}),
			);
		});
	},

	/**
	 * Calculate weighted average FIFO cost for a product
	 *
	 * Used when updating product.currentFIFOCost after stock movements.
	 * Formula: Sum(batchCost * remainingQty) / Sum(remainingQty)
	 *
	 * @param productId - Product to calculate cost for
	 * @returns Weighted average FIFO cost
	 */
	calculateWeightedAverageCostEffect(
		productId: string,
	): Effect.Effect<number, DatabaseError, OrganizationContext> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			const batches = yield* withDrizzleErrors(
				"purchase_order_item",
				"query",
				async () => {
					const quantityUsedSubquery = db
						.select({
							batchId: inventoryMovements.fifoBatchId,
							totalUsed:
								sql<number>`COALESCE(SUM(ABS(${inventoryMovements.quantity})), 0)`.as(
									"total_used",
								),
						})
						.from(inventoryMovements)
						.where(
							and(
								eq(inventoryMovements.productId, productId),
								eq(inventoryMovements.organizationId, organizationId),
								sql`${inventoryMovements.quantity} < 0`,
							),
						)
						.groupBy(inventoryMovements.fifoBatchId)
						.as("used");

					const result = await db
						.select({
							unitCost: purchaseOrderItems.unitCost,
							quantityReceived: purchaseOrderItems.quantityReceived,
							quantityUsed:
								sql<number>`COALESCE(${quantityUsedSubquery.totalUsed}, 0)`.as(
									"quantity_used",
								),
						})
						.from(purchaseOrderItems)
						.leftJoin(
							quantityUsedSubquery,
							eq(purchaseOrderItems.id, quantityUsedSubquery.batchId),
						)
						.where(eq(purchaseOrderItems.productId, productId));

					return result;
				},
			);

			if (batches.length === 0) {
				return 0; // No batches = no cost
			}

			const validBatches = batches
				.filter((b) => b.quantityReceived !== null)
				.map((b) => ({
					unitCost: b.unitCost,
					quantityReceived: b.quantityReceived!,
					quantityUsed: b.quantityUsed,
				}));

			return StockCalculator.calculateWeightedAverageCost({
				batches: validBatches,
			});
		});
	},

	/**
	 * Get all FIFO batches for a product (transparency/audit trail)
	 *
	 * Shows batch-level cost tracking for accounting and verification.
	 *
	 * @param productId - Product to get batches for
	 * @returns Product details with batch breakdown
	 */
	getFIFOBatchesForProductEffect(
		productId: string,
	): Effect.Effect<
		ProductFIFOBatchesResponse,
		ProductNotFound | DatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			// Get product details
			const productRows = yield* withDrizzleErrors(
				"product",
				"findUnique",
				() =>
					db
						.select()
						.from(products)
						.where(
							and(
								eq(products.id, productId),
								eq(products.organizationId, organizationId),
							),
						)
						.limit(1),
			);

			const product = productRows[0];
			if (!product) {
				return yield* Effect.fail(
					new ProductNotFound({ productId, organizationId }),
				);
			}

			// Get batches with remaining quantities
			const batches = yield* withDrizzleErrors(
				"purchase_order_item",
				"query",
				async () => {
					const quantityUsedSubquery = db
						.select({
							batchId: inventoryMovements.fifoBatchId,
							totalUsed:
								sql<number>`COALESCE(SUM(ABS(${inventoryMovements.quantity})), 0)`.as(
									"total_used",
								),
						})
						.from(inventoryMovements)
						.where(
							and(
								eq(inventoryMovements.productId, productId),
								eq(inventoryMovements.organizationId, organizationId),
								sql`${inventoryMovements.quantity} < 0`,
							),
						)
						.groupBy(inventoryMovements.fifoBatchId)
						.as("used");

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
							quantityUsed:
								sql<number>`COALESCE(${quantityUsedSubquery.totalUsed}, 0)`.as(
									"quantity_used",
								),
						})
						.from(purchaseOrderItems)
						.leftJoin(
							quantityUsedSubquery,
							eq(purchaseOrderItems.id, quantityUsedSubquery.batchId),
						)
						.where(eq(purchaseOrderItems.productId, productId))
						.orderBy(desc(purchaseOrderItems.createdAt)); // Newest first for display

					return result;
				},
			);

			return {
				productId: product.id,
				productName: product.name,
				currentFIFOCost: product.currentFIFOCost,
				totalStockQuantity: product.currentStockQuantity || 0,
				batches: batches.map((b) => ({
					batchId: b.id,
					productId: b.productId,
					unitCost: b.unitCost,
					quantityRemaining: (b.quantityReceived ?? 0) - b.quantityUsed,
					purchaseDate: new Date(b.createdAt).toISOString(),
					batchNumber: b.batchNumber,
					expiryDate: b.expiryDate
						? new Date(b.expiryDate).toISOString()
						: null,
				})),
			};
		});
	},
};
