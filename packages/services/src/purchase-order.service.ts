import { createError } from "@repo/utils";
import db, {
    withDbOperation,
    withTransaction,
    eq, and,
    products,
} from "@repo/db";
import { fifoService } from "./fifo.service";
import { buildStockArrivalMutations, applyStockArrivalMutations } from "./mutations";
import type { QuickStockArrival, PurchaseOrderResponse } from "@repo/schema";

export const purchaseOrderService = {
    async quickStockArrival(
        data: QuickStockArrival,
        organizationId: string
    ): Promise<PurchaseOrderResponse> {
        const product = await withDbOperation({
            operation: "findUnique",
            table: "product",
            context: { organizationId, productId: data.productId }
        }, () => db
            .select()
            .from(products)
            .where(and(
                eq(products.id, data.productId),
                eq(products.organizationId, organizationId)
            ))
            .limit(1)
            .then(rows => rows[0])
        );

        if (!product) {
            throw createError.notFound("Product", {
                productId: data.productId,
                organizationId
            });
        }

        const newFIFOCost = await fifoService.calculateWeightedAverageCost(
            data.productId,
            organizationId
        );

        const mutations = buildStockArrivalMutations({
            productId: data.productId,
            organizationId,
            quantity: data.quantity,
            unitCost: data.unitCost,
            supplierName: data.supplierName || "Quick Entry",
            batchNumber: data.batchNumber,
            expiryDate: data.expiryDate,
            currentStock: product.currentStockQuantity || 0,
            newFIFOCost,
        });

        await withTransaction(async (tx) => {
            await applyStockArrivalMutations(tx, mutations);
        });

        return {
            ...mutations.purchaseOrder,
            items: [mutations.purchaseOrderItem],
        } as PurchaseOrderResponse;
    },
};
