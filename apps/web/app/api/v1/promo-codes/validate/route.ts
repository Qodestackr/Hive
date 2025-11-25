import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";
import { z } from "@repo/utils";
import { promoCodeService } from "@repo/services";

const PromoCodeValidateQuerySchema = z.object({
    code: z.string().min(1, "Promo code is required"),
});

const PromoCodeValidateResponseSchema = z.object({
    code: z.string(),
    productId: z.string().nullable(),
    discountType: z.enum(["percentage", "fixed"]),
    discountValue: z.number(),
    expiresAt: z.string(),
    campaignId: z.string().nullable(),
    isValid: z.literal(true), // Only returns on success
});

/**
 * GET /api/v1/promo-codes/validate?code=XXX
 * 
 * Validate a promo code without redeeming it.
 * 
 * This is a REAL PRODUCTION route using Effect error handling end-to-end.
 * 
 * Returns:
 * - 200: Promo code details (if valid)
 * - 404: PromoCodeNotFound (RFC 7807)
 * - 422: PromoCodeExpired or PromoCodeAlreadyRedeemed (RFC 7807)
 * 
 * Type-safe errors - compiler enforces handling all cases.
 */
export const GET = createWorkspaceRouteEffect({
    inputSchema: PromoCodeValidateQuerySchema,
    outputSchema: PromoCodeValidateResponseSchema,

    // Handler returns Effect - all errors typed in signature
    handler: (query, { workspace }) => {
        const { Effect } = require("effect");

        return promoCodeService
            .validatePromoCodeEffect(query.code, workspace.id)
            .pipe(
                // Transform promo code to response format
                Effect.map((promoCode) => ({
                    code: promoCode.code,
                    productId: promoCode.productId,
                    discountType: promoCode.discountType,
                    discountValue: promoCode.discountValue,
                    expiresAt: promoCode.expiresAt,
                    campaignId: promoCode.campaignId,
                    isValid: true as const,
                }))
            );
    },

    options: {
        operationName: "validatePromoCode",
        requiredPermissions: ["promo_codes.read"],
        errorContext: {
            feature: "profit-intelligence",
            action: "validate-promo-code",
        },
    },
});
