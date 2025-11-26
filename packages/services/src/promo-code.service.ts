import db, {
	and,
	type Campaign,
	campaigns,
	eq,
	products,
	promoCodes,
	withDrizzleErrors,
} from "@repo/db";
import type {
	PromoCodeRedeem,
	PromoCodeRedemptionResponse,
} from "@repo/schema";
import { OrganizationContext } from "@repo/utils";
import {
	GenericDatabaseError,
	type InsufficientInventory,
	type NoCostData,
	ProductNotFound,
	PromoCodeAlreadyRedeemed,
	PromoCodeExpired,
	PromoCodeNoProduct,
	PromoCodeNotFound,
} from "@repo/utils/errors/domain";

import { Effect } from "effect";
import { ProfitCalculator } from "./calculators/profit-calculator";
import { fifoService } from "./fifo.service";
import {
	applyRedemptionWithAudit,
	buildRedemptionMutations,
} from "./mutations";

export const promoCodeService = {
	redeemPromoCodeEffect(
		data: PromoCodeRedeem,
	): Effect.Effect<
		PromoCodeRedemptionResponse,
		| PromoCodeNotFound
		| PromoCodeAlreadyRedeemed
		| PromoCodeExpired
		| PromoCodeNoProduct
		| ProductNotFound
		| InsufficientInventory
		| NoCostData
		| GenericDatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;
			const promoCodeRows = yield* withDrizzleErrors(
				"promo_codes",
				"findByCode",
				() =>
					db
						.select()
						.from(promoCodes)
						.where(
							and(
								eq(promoCodes.code, data.code),
								eq(promoCodes.organizationId, organizationId),
							),
						)
						.limit(1),
			);

			const promoCode = promoCodeRows[0];
			if (!promoCode) {
				return yield* Effect.fail(
					new PromoCodeNotFound({ code: data.code, organizationId }),
				);
			}

			if (promoCode.isRedeemed) {
				return yield* Effect.fail(
					new PromoCodeAlreadyRedeemed({
						code: data.code,
						redeemedAt: new Date(promoCode.redeemedAt!),
					}),
				);
			}

			const expiryDate = new Date(promoCode.expiresAt);
			if (expiryDate < new Date()) {
				return yield* Effect.fail(
					new PromoCodeExpired({
						code: data.code,
						expiresAt: expiryDate,
					}),
				);
			}

			if (!promoCode.productId) {
				return yield* Effect.fail(new PromoCodeNoProduct({ code: data.code }));
			}

			const productRows = yield* withDrizzleErrors("products", "findById", () =>
				db
					.select()
					.from(products)
					.where(
						and(
							eq(products.id, promoCode.productId!),
							eq(products.organizationId, organizationId),
						),
					)
					.limit(1),
			);

			const product = productRows[0];
			if (!product) {
				return yield* Effect.fail(
					new ProductNotFound({
						productId: promoCode.productId!,
						organizationId,
					}),
				);
			}

			const quantityRedeemed = data.quantityRedeemed || 1;
			const fifoResult = yield* fifoService.getOldestAvailableBatchEffect(
				promoCode.productId!,
				quantityRedeemed,
			);

			const profit = ProfitCalculator.calculate({
				basePrice: product.basePrice,
				quantity: quantityRedeemed,
				discountType: promoCode.discountType,
				discountValue: promoCode.discountValue,
				unitCost: fifoResult.unitCost,
			});

			// Get campaign (optional)
			let campaign: Campaign | undefined;
			if (promoCode.campaignId) {
				const campaignRows = yield* withDrizzleErrors(
					"campaigns",
					"findById",
					() =>
						db
							.select()
							.from(campaigns)
							.where(eq(campaigns.id, promoCode.campaignId!))
							.limit(1),
				);
				campaign = campaignRows[0];
			}

			const mutations = buildRedemptionMutations({
				promoCode,
				product,
				fifoResult,
				profit,
				quantityRedeemed,
				organizationId,
				campaign,
				saleorOrderId: data.saleorOrderId,
			});

			// Apply mutations + audit log ATOMICALLY
			yield* Effect.tryPromise({
				try: () =>
					applyRedemptionWithAudit(mutations, organizationId, promoCode.code),
				catch: (error) =>
					new GenericDatabaseError({
						operation: "applyRedemptionWithAudit",
						table: "promo_codes",
						pgCode: undefined,
						detail: String(error),
						originalError: error,
					}),
			});

			return {
				success: true,
				promoCode: {
					...promoCode,
					isRedeemed: true,
					redeemedAt: new Date(),
					quantityRedeemed,
					originalPrice: profit.originalPrice,
					discountAmount: profit.discountAmount,
					netRevenue: profit.netRevenue,
					unitCostAtRedemption: fifoResult.unitCost,
					totalCOGS: profit.totalCOGS,
					actualProfit: profit.actualProfit,
					isProfitable: profit.isProfitable,
					costCalculationMethod: fifoResult.method,
				},
				discountAmount: profit.discountAmount,
				netRevenue: profit.netRevenue,
				unitCostAtRedemption: fifoResult.unitCost,
				actualProfit: profit.actualProfit,
				isProfitable: profit.isProfitable,
				message: profit.isProfitable
					? `Profitable redemption: KES ${profit.actualProfit.toFixed(2)} profit`
					: `Loss-making redemption: KES ${Math.abs(profit.actualProfit).toFixed(2)} loss`,
			};
		}) as Effect.Effect<
			PromoCodeRedemptionResponse,
			| PromoCodeNotFound
			| PromoCodeAlreadyRedeemed
			| PromoCodeExpired
			| PromoCodeNoProduct
			| ProductNotFound
			| InsufficientInventory
			| GenericDatabaseError,
			never
		>;
	},
	/**
	 * Validate promo code using Effect
	 *
	 * Returns the actual promo code on success, or typed error on failure.
	 * @param code - Promo code to validate
	 * @returns Effect that succeeds with PromoCode or fails with typed error
	 */
	validatePromoCodeEffect(code: string) {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			const promoCode = yield* withDrizzleErrors("promo_codes", "select", () =>
				db
					.select()
					.from(promoCodes)
					.where(
						and(
							eq(promoCodes.code, code),
							eq(promoCodes.organizationId, organizationId),
						),
					)
					.limit(1)
					.then((rows) => rows[0]),
			);

			if (!promoCode) {
				return yield* Effect.fail(
					new PromoCodeNotFound({ code, organizationId }),
				);
			}

			if (promoCode.isRedeemed) {
				return yield* Effect.fail(
					new PromoCodeAlreadyRedeemed({
						code,
						redeemedAt: new Date(promoCode.redeemedAt!),
					}),
				);
			}

			const expiryDate = new Date(promoCode.expiresAt);
			if (expiryDate < new Date()) {
				return yield* Effect.fail(
					new PromoCodeExpired({ code, expiresAt: expiryDate }),
				);
			}

			return promoCode;
		});
	},
};
