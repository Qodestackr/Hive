import db, {
    eq, and, sql,
    withDbOperation,
    withTransaction,
    withDrizzleErrors,
    reconciliationLogs,
    products,
    inventoryMovements
} from "@repo/db";
import { createError } from "@repo/utils";
import { Effect } from "effect";
import { OrganizationContext } from "@repo/utils";
import { ProductNotFound, GenericDatabaseError, type DatabaseError } from "@repo/utils/errors/domain";
import { StockCalculator } from "./calculators/stock-calculator";
import {
    buildReconciliationMutations,
    buildCorrectionMutations,
    applyReconciliationMutations,
    applyCorrectionMutations
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
    async reconcileProductStock(
        productId: string,
        organizationId: string,
        actualPhysicalCount?: number
    ): Promise<ReconciliationResult> {
        const movements = await withDbOperation({
            operation: "query",
            table: "inventory_movement",
            context: { organizationId, productId }
        }, async () => {
            const result = await db
                .select({
                    totalQty: sql<number>`COALESCE(SUM(${inventoryMovements.quantity}), 0)`.as('total')
                })
                .from(inventoryMovements)
                .where(and(
                    eq(inventoryMovements.productId, productId),
                    eq(inventoryMovements.organizationId, organizationId)
                ));

            return result;
        });

        const expectedQuantity = movements[0]?.totalQty || 0;

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

        const recordedQuantity = product.currentStockQuantity || 0;
        const actualQuantity = actualPhysicalCount ?? recordedQuantity;

        const reconciliation = StockCalculator.calculateReconciliationDiscrepancy({
            expectedQuantity,
            actualQuantity,
            tolerance: 1,
        });

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

            await withTransaction(async (tx) => {
                await applyReconciliationMutations(tx, mutations);
                reconciliationLogId = mutations.reconciliationLog.id;
            });

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
    },

    async reconcileAllProducts(organizationId: string): Promise<ReconciliationSummary> {
        const allProducts = await withDbOperation({
            operation: "query",
            table: "product",
            context: { organizationId }
        }, () => db
            .select({ id: products.id })
            .from(products)
            .where(eq(products.organizationId, organizationId))
        );

        const results = await Promise.all(
            allProducts.map(p =>
                this.reconcileProductStock(p.id, organizationId)
                    .catch(err => ({
                        isInSync: false,
                        expectedQuantity: 0,
                        recordedQuantity: 0,
                        actualQuantity: 0,
                        discrepancy: 0,
                        error: err.message,
                        productId: p.id,
                    } as ReconciliationResult & { error?: string, productId?: string }))
            )
        );

        const discrepancies = results
            .filter(r => !r.isInSync)
            .map(r => ({
                productId: (r as any).productId || 'unknown',
                discrepancy: r.discrepancy
            }));

        return {
            totalProducts: allProducts.length,
            inSync: results.filter(r => r.isInSync).length,
            outOfSync: discrepancies.length,
            discrepancies,
        };
    },

    correctInventoryDiscrepancyEffect(
        reconciliationLogId: string,
        correctionQty: number,
        reason: string
    ): Effect.Effect<void, GenericDatabaseError | DatabaseError, OrganizationContext> {
        return Effect.gen(function* () {
            const { organizationId } = yield* OrganizationContext;

            const logRows = yield* withDrizzleErrors(
                "reconciliation_log",
                "findUnique",
                () => db
                    .select()
                    .from(reconciliationLogs)
                    .where(eq(reconciliationLogs.id, reconciliationLogId))
                    .limit(1)
            );

            const log = logRows[0];
            if (!log) {
                throw createError.notFound("Reconciliation log", { reconciliationLogId });
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
                })
            );
        });
    }
};
