import { promoCodes } from "../domains/promo-codes";
import { createMutation, createQuery } from "../factories";

// List promo codes
export const usePromoCodes = createQuery("promo-codes", promoCodes.list);

// Get single promo code
export const usePromoCode = createQuery("promo-code", promoCodes.get);

export const useCreatePromoCode = createMutation(promoCodes.create, {
	invalidateKeys: ["promo-codes"],
});

export const useBulkCreatePromoCodes = createMutation(promoCodes.bulkCreate, {
	invalidateKeys: ["promo-codes"],
});

// Redeem promo code (FIFO profit calculation)
export const useRedeemPromoCode = createMutation(promoCodes.redeem, {
	invalidateKeys: ["promo-codes", "campaigns", "campaign-stats", "inventory"],
});

export const useValidatePromoCode = createMutation(promoCodes.validate);
