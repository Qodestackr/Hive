import type { PromoCode } from "@repo/db";
import {
	PromoCodeValidateQuerySchema,
	PromoCodeValidateResponseSchema,
} from "@repo/schema";
import { promoCodeService } from "@repo/services";
import { Effect } from "effect";
import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";

/**
 * GET /api/v1/promo-codes/validate?code=XXX
 *
 * Validate a promo code without redeeming it.
 */
export const GET = createWorkspaceRouteEffect({
	inputSchema: PromoCodeValidateQuerySchema,
	outputSchema: PromoCodeValidateResponseSchema,
	handler: (query, { workspace }) => {
		return promoCodeService
			.validatePromoCodeEffect(query.code) // workspace.id
			.pipe(
				Effect.map((promoCode: PromoCode) => ({
					code: promoCode.code,
					productId: promoCode.productId,
					discountType: promoCode.discountType,
					discountValue: promoCode.discountValue,
					expiresAt: promoCode.expiresAt.toISOString(),
					campaignId: promoCode.campaignId,
					isValid: true as const,
				})),
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
