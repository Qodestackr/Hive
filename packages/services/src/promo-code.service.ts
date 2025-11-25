import db, {
    promoCodes,
    products,
    campaigns,
    eq, and,
    withDbOperation,
} from "@repo/db";

import { fifoService } from "./fifo.service";
import { ProfitCalculator } from "./calculators/profit-calculator";
import { buildRedemptionMutations, applyRedemptionWithAudit } from "./mutations";
import type {
    PromoCodeRedeem,
    PromoCodeRedemptionResponse
} from "@repo/schema";

import { Effect } from "effect";
import { withDrizzleErrors } from "@repo/db";
import {
    PromoCodeNotFound,
    PromoCodeAlreadyRedeemed,
    PromoCodeExpired,
    PromoCodeNoProduct,
    ProductNotFound,
    InsufficientInventory,
    NoCostData,
    GenericDatabaseError,
} from "@repo/utils/errors/domain";
import { OrganizationContext } from "@repo/utils";

export const promoCodeService = {
    /**
     * Effect-based promo code redemption 
     * 
     * Returns typed errors instead of throwing exceptions.
     * Gets organizationId from context - no prop drilling!
     * All possible failures are in the type signature - compiler enforced!
     */
    redeemPromoCodeEffect(
        data: PromoCodeRedeem
    ): Effect.Effect<
        PromoCodeRedemptionResponse,
        PromoCodeNotFound | PromoCodeAlreadyRedeemed | PromoCodeExpired |
        PromoCodeNoProduct | ProductNotFound | InsufficientInventory | NoCostData |
        GenericDatabaseError,
        OrganizationContext
    > {
        return Effect.gen(function* () {
            // Get organizationId from context
            const { organizationId } = yield* OrganizationContext;
            const promoCodeRows = yield* withDrizzleErrors(
                "promo_codes",
                "findByCode",
                () => db
                    .select()
                    .from(promoCodes)
                    .where(and(
                        eq(promoCodes.code, data.code),
                        eq(promoCodes.organizationId, organizationId)
                    ))
                    .limit(1)
            );

            const promoCode = promoCodeRows[0];
            if (!promoCode) {
                return yield* Effect.fail(new PromoCodeNotFound({ code: data.code, organizationId }));
            }

            if (promoCode.isRedeemed) {
                return yield* Effect.fail(new PromoCodeAlreadyRedeemed({
                    code: data.code,
                    redeemedAt: new Date(promoCode.redeemedAt!)
                }));
            }

            const expiryDate = new Date(promoCode.expiresAt);
            if (expiryDate < new Date()) {
                return yield* Effect.fail(new PromoCodeExpired({
                    code: data.code,
                    expiresAt: expiryDate
                }));
            }

            if (!promoCode.productId) {
                return yield* Effect.fail(new PromoCodeNoProduct({ code: data.code }));
            }

            const productRows = yield* withDrizzleErrors(
                "products",
                "findById",
                () => db
                    .select()
                    .from(products)
                    .where(and(
                        eq(products.id, promoCode.productId!),
                        eq(products.organizationId, organizationId)
                    ))
                    .limit(1)
            );

            const product = productRows[0];
            if (!product) {
                return yield* Effect.fail(new ProductNotFound({
                    productId: promoCode.productId!,
                    organizationId
                }));
            }

            // Get FIFO cost (from context - no prop drilling!)
            const quantityRedeemed = data.quantityRedeemed || 1;
            const fifoResult = yield* fifoService.getOldestAvailableBatchEffect(
                promoCode.productId!,
                quantityRedeemed
            );

            // Calculate profit (PURE)
            const profit = ProfitCalculator.calculate({
                basePrice: product.basePrice,
                quantity: quantityRedeemed,
                discountType: promoCode.discountType,
                discountValue: promoCode.discountValue,
                unitCost: fifoResult.unitCost,
            });

            // Get campaign (optional)
            let campaign = undefined;
            if (promoCode.campaignId) {
                const campaignRows = yield* withDrizzleErrors(
                    "campaigns",
                    "findById",
                    () => db
                        .select()
                        .from(campaigns)
                        .where(eq(campaigns.id, promoCode.campaignId!))
                        .limit(1)
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
                try: () => applyRedemptionWithAudit(mutations, organizationId, promoCode.code),
                catch: (error) => new GenericDatabaseError({
                    operation: "applyRedemptionWithAudit",
                    table: "promo_codes",
                    pgCode: undefined,
                    detail: String(error),
                    originalError: error
                })
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
                    : `Loss-making redemption: KES ${Math.abs(profit.actualProfit).toFixed(2)} loss`
            };
        }) as Effect.Effect<
            PromoCodeRedemptionResponse,
            PromoCodeNotFound | PromoCodeAlreadyRedeemed | PromoCodeExpired |
            PromoCodeNoProduct | ProductNotFound | InsufficientInventory | GenericDatabaseError,
            never
        >;
    },

    /**
    * Validate promo code without redeeming
    * 
    * @param code - Promo code to validate
    * @param organizationId - Organization context
    * @returns Validation result
    */
    async validatePromoCode(
        code: string,
        organizationId: string
    ): Promise<{ isValid: boolean; reason?: string }> {
        const promoCode = await withDbOperation({
            operation: "findUnique",
            table: "promo_code",
            context: { organizationId, code }
        }, () => db
            .select()
            .from(promoCodes)
            .where(and(
                eq(promoCodes.code, code),
                eq(promoCodes.organizationId, organizationId)
            ))
            .limit(1)
            .then(rows => rows[0])
        );

        if (!promoCode) {
            return { isValid: false, reason: "Code not found" };
        }

        if (promoCode.isRedeemed) {
            return { isValid: false, reason: "Code already redeemed" };
        }

        const expiryDate = new Date(promoCode.expiresAt);
        if (expiryDate < new Date()) {
            return { isValid: false, reason: "Code expired" };
        }

        return { isValid: true };
    },

    /**
     * Validate promo code using Effect (NEW - Type-safe version)
     * 
     * Returns the actual promo code on success, or typed error on failure.
     * This version provides full type safety and structured errors.
     * 
     * @param code - Promo code to validate
     * @param organizationId - Organization context
     * @returns Effect that succeeds with PromoCode or fails with typed error
     * 
     * @example
     * ```typescript
     * import { Effect } from "effect"
     * 
     * const result = await Effect.runPromise(
     *   promoCodeService.validatePromoCodeEffect("SUMMER20", "org-123")
     * )
     * // result is the actual PromoCode object
     * ```
     */
    validatePromoCodeEffect(
        code: string,
        organizationId: string
    ) {
        // Import Effect and error handler
        const { Effect } = require("effect");
        const { withDrizzleErrors } = require("@repo/db/handle-drizzle-error");
        const {
            PromoCodeNotFound,
            PromoCodeAlreadyRedeemed,
            PromoCodeExpired
        } = require("@repo/utils");

        return Effect.gen(function* () {
            // Use withDrizzleErrors for proper DB error handling
            const promoCode = yield* withDrizzleErrors(
                "promo_codes",
                "select",
                () => db
                    .select()
                    .from(promoCodes)
                    .where(and(
                        eq(promoCodes.code, code),
                        eq(promoCodes.organizationId, organizationId)
                    ))
                    .limit(1)
                    .then(rows => rows[0])
            );

            // Check if code exists
            if (!promoCode) {
                return yield* Effect.fail(
                    new PromoCodeNotFound({ code, organizationId })
                );
            }

            // Check if already redeemed
            if (promoCode.isRedeemed) {
                return yield* Effect.fail(
                    new PromoCodeAlreadyRedeemed({
                        code,
                        redeemedAt: new Date(promoCode.redeemedAt!)
                    })
                );
            }

            // Check if expired
            const expiryDate = new Date(promoCode.expiresAt);
            if (expiryDate < new Date()) {
                return yield* Effect.fail(
                    new PromoCodeExpired({ code, expiresAt: expiryDate })
                );
            }

            // Valid! Return the actual promo code
            return promoCode;
        });
    }
};
