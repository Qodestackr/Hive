import {
	PromoCodeRedeemSchema,
	PromoCodeRedemptionResponseSchema,
} from "@repo/schema";
import { promoCodeService } from "@repo/services/src/promo-code.service";
import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";

// Calculate actual profit using FIFO cost at redemption time.
export const POST = createWorkspaceRouteEffect({
	inputSchema: PromoCodeRedeemSchema,
	outputSchema: PromoCodeRedemptionResponseSchema,

	handler: (data) => promoCodeService.redeemPromoCodeEffect(data),

	options: {
		operationName: "redeemPromoCode",
		requiredPermissions: ["promo_codes.redeem"],
		errorContext: {
			feature: "profit-intelligence",
			action: "redeem-promo-code",
		},
	},
});
