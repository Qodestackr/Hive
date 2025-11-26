import db, {
	and,
	eq,
	inventoryMovements,
	products,
	reconciliationLogs,
	sql,
	withDrizzleErrors,
	withTransaction,
} from "@repo/db";
import { OrganizationContext } from "@repo/utils";
import {
	type DatabaseError,
	type GenericDatabaseError,
	ProductNotFound,
} from "@repo/utils/errors/domain";
import { Effect } from "effect";
import { StockCalculator } from "./calculators/stock-calculator";
import {
	applyCorrectionMutations,
	applyReconciliationMutations,
	buildCorrectionMutations,
	buildReconciliationMutations,
} from "./mutations";

export interface ReconciliationResult {
	isInSync: boolean;
	expectedQuantity: number;
	recordedQuantity: number;
	actualQuantity: number;
	discrepancy: number;
	reconciliationLogId?: string;
	requiresAction?: boolean;
}

export interface ReconciliationSummary {
	totalProducts: number;
	inSync: number;
	outOfSync: number;
	discrepancies: Array<{
		productId: string;
		discrepancy: number;
	}>;
}

export const reconciliationService = {
	reconcileProductStockEffect(
		productId: string,
		actualPhysicalCount?: number,
	): Effect.Effect<
		ReconciliationResult,
		ProductNotFound | DatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			const movementRows = yield* withDrizzleErrors(
				"inventory_movement",
				"query",
				async () => {
					const result = await db
						.select({
							totalQty:
								sql<number>`COALESCE(SUM(${inventoryMovements.quantity}), 0)`.as(
									"total",
								),
						})
						.from(inventoryMovements)
						.where(
							and(
								eq(inventoryMovements.productId, productId),
								eq(inventoryMovements.organizationId, organizationId),
							),
						);

					return result;
				},
			);

			const expectedQuantity = movementRows[0]?.totalQty || 0;

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

			const recordedQuantity = product.currentStockQuantity || 0;
			const actualQuantity = actualPhysicalCount ?? recordedQuantity;

			const reconciliation = StockCalculator.calculateReconciliationDiscrepancy(
				{
					expectedQuantity,
					actualQuantity,
					tolerance: 1,
				},
			);

			if (!reconciliation.isInSync) {
				const mutations = buildReconciliationMutations({
					organizationId,
					productId,
					productName: product.name,
					expectedQuantity,
					actualQuantity,
					discrepancy: reconciliation.discrepancy,
					currentFIFOCost: product.currentFIFOCost,
				});

				let reconciliationLogId: string | undefined;

				yield* Effect.promise(() =>
					withTransaction(async (tx) => {
						await applyReconciliationMutations(tx, mutations);
						reconciliationLogId = mutations.reconciliationLog.id;
					}),
				);

				return {
					isInSync: false,
					expectedQuantity,
					recordedQuantity,
					actualQuantity,
					discrepancy: reconciliation.discrepancy,
					reconciliationLogId,
					requiresAction: true,
				};
			}

			return {
				isInSync: true,
				expectedQuantity,
				recordedQuantity,
				actualQuantity,
				discrepancy: 0,
			};
		});
	},

	reconcileAllProductsEffect(): Effect.Effect<
		ReconciliationSummary,
		ProductNotFound | GenericDatabaseError | DatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			const allProductRows = yield* withDrizzleErrors("product", "query", () =>
				db
					.select({ id: products.id })
					.from(products)
					.where(eq(products.organizationId, organizationId)),
			);

			// Process each product
			const results: (ReconciliationResult & {
				error?: string;
				productId?: string;
			})[] = [];

			for (const p of allProductRows) {
				try {
					const result =
						yield* reconciliationService.reconcileProductStockEffect(p.id);
					results.push(result as any);
				} catch (err) {
					results.push({
						isInSync: false,
						expectedQuantity: 0,
						recordedQuantity: 0,
						actualQuantity: 0,
						discrepancy: 0,
						error: (err as Error).message,
						productId: p.id,
					});
				}
			}

			const discrepancies = results
				.filter((r) => !r.isInSync)
				.map((r) => ({
					productId: (r as any).productId || "unknown",
					discrepancy: r.discrepancy,
				}));

			return {
				totalProducts: allProductRows.length,
				inSync: results.filter((r) => r.isInSync).length,
				outOfSync: discrepancies.length,
				discrepancies,
			};
		});
	},

	correctInventoryDiscrepancyEffect(
		reconciliationLogId: string,
		correctionQty: number,
		reason: string,
	): Effect.Effect<
		void,
		ProductNotFound | GenericDatabaseError | DatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			const logRows = yield* withDrizzleErrors(
				"reconciliation_log",
				"findUnique",
				() =>
					db
						.select()
						.from(reconciliationLogs)
						.where(eq(reconciliationLogs.id, reconciliationLogId))
						.limit(1),
			);

			const log = logRows[0];
			if (!log) {
				return yield* Effect.fail(
					new ProductNotFound({
						productId: reconciliationLogId,
						organizationId,
					}),
				);
			}

			const mutations = buildCorrectionMutations({
				reconciliationLogId,
				organizationId,
				productId: log.productId,
				correctionQty,
				actualQuantity: log.actualQuantity,
				reason,
			});

			yield* Effect.promise(() =>
				withTransaction(async (tx) => {
					await applyCorrectionMutations(tx, mutations);
				}),
			);
		});
	},
};
