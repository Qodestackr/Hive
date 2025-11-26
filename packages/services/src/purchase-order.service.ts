import db, {
	and,
	eq,
	products,
	withDrizzleErrors,
	withTransaction,
} from "@repo/db";
import type { PurchaseOrderResponse, QuickStockArrival } from "@repo/schema";
import { OrganizationContext } from "@repo/utils";
import {
	type DatabaseError,
	GenericDatabaseError,
	ProductNotFound,
} from "@repo/utils/errors/domain";
import { Effect } from "effect";
import { fifoService } from "./fifo.service";
import {
	applyStockArrivalMutations,
	buildStockArrivalMutations,
} from "./mutations";

export const purchaseOrderService = {
	quickStockArrivalEffect(
		data: QuickStockArrival,
	): Effect.Effect<
		PurchaseOrderResponse,
		ProductNotFound | DatabaseError | GenericDatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			const productRows = yield* withDrizzleErrors(
				"product",
				"findUnique",
				() =>
					db
						.select()
						.from(products)
						.where(
							and(
								eq(products.id, data.productId),
								eq(products.organizationId, organizationId),
							),
						)
						.limit(1),
			);

			const product = productRows[0];
			if (!product) {
				return yield* Effect.fail(
					new ProductNotFound({
						productId: data.productId,
						organizationId,
					}),
				);
			}

			const newFIFOCost = yield* fifoService.calculateWeightedAverageCostEffect(
				data.productId,
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

			yield* Effect.tryPromise({
				try: () =>
					withTransaction(async (tx) => {
						await applyStockArrivalMutations(tx, mutations);
					}),
				catch: (error) =>
					new GenericDatabaseError({
						operation: "applyStockArrivalMutations",
						table: "purchase_orders",
						pgCode: undefined,
						detail: String(error),
						originalError: error,
					}),
			});

			return {
				...mutations.purchaseOrder,
				items: [mutations.purchaseOrderItem],
			} as PurchaseOrderResponse;
		});
	},
};
