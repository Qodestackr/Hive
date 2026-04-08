import { executeSaleorRequest } from "../client/saleor-client";
import { SaleorPromotionError } from "../errors/saleor-errors";
import {
	GetActivePromotionsDocument,
	type GetActivePromotionsQuery,
	GetPromotionWithRulesDocument,
	type GetPromotionWithRulesQuery,
	PromotionCreateDocument,
	type PromotionCreateMutation,
	PromotionDeleteDocument,
	PromotionRuleCreateDocument,
	type PromotionRuleCreateMutation,
	PromotionRuleDeleteDocument,
	PromotionRuleUpdateDocument,
	PromotionUpdateDocument,
} from "../gql/graphql";
import type { SaleorContext } from "../types";

/**
 * Promotion rule configuration
 * Defines discount rules for a promotion
 */
export interface PromotionRuleConfig {
	name: string;
	description?: string;

	/** Which products this rule applies to */
	productIds?: string[];

	/** Discount type */
	discountType: "PERCENTAGE" | "FIXED";

	/** Discount value (percentage or fixed amount) */
	discountValue: number;

	/** Minimum quantity for rule to apply */
	minQuantity?: number;

	/** Minimum subtotal for rule to apply */
	minSubtotal?: number;
}

/**
 * Create a promotion in Saleor
 *
 * NOTE: This only creates the promotion shell.
 * Use createPromotionRule() to add discount rules.
 *
 * @throws {SaleorPromotionError} If creation fails
 */
export async function createPromotion(
	input: {
		name: string;
		description?: string;
		startDate: Date;
		endDate?: Date;
		/** Metadata to link to Promco campaign */
		promcoCampaignId?: string;
	},
	context: SaleorContext,
): Promise<any> {
	// Build metadata array
	const metadata = input.promcoCampaignId
		? [{ key: "promco_campaign_id", value: input.promcoCampaignId }]
		: [];

	const data = await executeSaleorRequest(
		PromotionCreateDocument,
		{
			input: {
				name: input.name,
				description: input.description,
				startDate: input.startDate.toISOString(),
				endDate: input.endDate?.toISOString(),
				metadata,
			},
		},
		context,
	);

	if (data.promotionCreate?.errors?.length) {
		throw new SaleorPromotionError({
			promotionName: input.name,
			operation: "create",
			reason: "Saleor returned validation errors",
			saleorErrors: data.promotionCreate.errors,
		});
	}

	if (!data.promotionCreate?.promotion) {
		throw new SaleorPromotionError({
			promotionName: input.name,
			operation: "create",
			reason: "No promotion returned from Saleor",
		});
	}

	return data.promotionCreate.promotion;
}

/**
 * Create a promotion rule
 *
 * Rules define the actual discount logic:
 * - Which products get discounted
 * - How much discount (percentage or fixed)
 * - Conditions (min quantity, min subtotal)
 *
 * @throws {SaleorPromotionError} If rule creation fails
 */
export async function createPromotionRule(
	promotionId: string,
	rule: PromotionRuleConfig,
	context: SaleorContext,
): Promise<any> {
	// Build catalogue predicate (which products)
	const cataloguePredicate = rule.productIds
		? {
				productPredicate: {
					ids: rule.productIds,
				},
			}
		: undefined;

	// Build order predicate (conditions)
	let orderPredicate: any;

	if (rule.minQuantity || rule.minSubtotal) {
		orderPredicate = {};

		if (rule.minQuantity) {
			orderPredicate.baseSubtotalPrice = {
				range: { gte: rule.minQuantity },
			};
		}

		if (rule.minSubtotal) {
			orderPredicate.baseSubtotalPrice = {
				range: { gte: rule.minSubtotal },
			};
		}
	}

	const data = await executeSaleorRequest(
		PromotionRuleCreateDocument,
		{
			input: {
				promotion: promotionId,
				name: rule.name,
				description: rule.description,
				channels: [context.channelId],
				rewardValueType: rule.discountType,
				rewardValue: rule.discountValue,
				cataloguePredicate,
				orderPredicate,
			},
		},
		context,
	);

	if (data.promotionRuleCreate?.errors?.length) {
		throw new SaleorPromotionError({
			promotionId,
			operation: "createRule",
			reason: "Rule creation failed",
			saleorErrors: data.promotionRuleCreate.errors,
		});
	}

	if (!data.promotionRuleCreate?.promotionRule) {
		throw new SaleorPromotionError({
			promotionId,
			operation: "createRule",
			reason: "No rule returned from Saleor",
		});
	}

	return data.promotionRuleCreate.promotionRule;
}

/**
 * Get promotion details with all rules
 *
 * @throws {SaleorPromotionError} If promotion not found
 */
export async function getPromotion(
	promotionId: string,
	context: SaleorContext,
): Promise<any> {
	const data = await executeSaleorRequest(
		GetPromotionWithRulesDocument,
		{ id: promotionId },
		context,
	);

	if (!data.promotion) {
		throw new SaleorPromotionError({
			promotionId,
			operation: "get",
			reason: "Promotion not found in Saleor",
		});
	}

	return data.promotion;
}

/**
 * List active promotions
 *
 * Filters by current date (start <= now <= end)
 * Useful for syncing Promco campaigns with Saleor promotions
 */
export async function listActivePromotions(
	context: SaleorContext,
	params: {
		first?: number;
		after?: string;
	} = {},
): Promise<any[]> {
	const { first = 50, after } = params;

	const data = await executeSaleorRequest(
		GetActivePromotionsDocument,
		{ first, after },
		context,
	);

	const now = new Date();

	// Filter to only currently active promotions
	return (data.promotions?.edges || [])
		.map((edge: any) => edge.node)
		.filter((promo: any) => {
			const start = new Date(promo.startDate);
			const end = promo.endDate ? new Date(promo.endDate) : null;
			return start <= now && (!end || end >= now);
		});
}

/**
 * Update promotion metadata
 *
 * Used to link Saleor promotions to Promco campaigns
 * or store additional tracking data
 */
export async function updatePromotionMetadata(
	promotionId: string,
	metadata: Array<{ key: string; value: string }>,
	context: SaleorContext,
): Promise<any> {
	const data = await executeSaleorRequest(
		PromotionUpdateDocument,
		{
			id: promotionId,
			input: { metadata },
		},
		context,
	);

	if (data.promotionUpdate?.errors?.length) {
		throw new SaleorPromotionError({
			promotionId,
			operation: "update",
			reason: "Metadata update failed",
			saleorErrors: data.promotionUpdate.errors,
		});
	}

	return data.promotionUpdate?.promotion;
}

/**
 * Update promotion dates or description
 */
export async function updatePromotion(
	promotionId: string,
	updates: {
		name?: string;
		description?: string;
		startDate?: Date;
		endDate?: Date;
	},
	context: SaleorContext,
): Promise<any> {
	const data = await executeSaleorRequest(
		PromotionUpdateDocument,
		{
			id: promotionId,
			input: {
				name: updates.name,
				description: updates.description,
				startDate: updates.startDate?.toISOString(),
				endDate: updates.endDate?.toISOString(),
			},
		},
		context,
	);

	if (data.promotionUpdate?.errors?.length) {
		throw new SaleorPromotionError({
			promotionId,
			operation: "update",
			reason: "Promotion update failed",
			saleorErrors: data.promotionUpdate.errors,
		});
	}

	return data.promotionUpdate?.promotion;
}

/**
 * Update a promotion rule
 *
 * Useful for adjusting discount values or conditions
 */
export async function updatePromotionRule(
	ruleId: string,
	updates: Partial<PromotionRuleConfig>,
	context: SaleorContext,
): Promise<any> {
	// Build updated predicates if provided
	const cataloguePredicate = updates.productIds
		? { productPredicate: { ids: updates.productIds } }
		: undefined;

	let orderPredicate: any;
	if (updates.minQuantity || updates.minSubtotal) {
		orderPredicate = {};
		if (updates.minQuantity) {
			orderPredicate.baseSubtotalPrice = {
				range: { gte: updates.minQuantity },
			};
		}
		if (updates.minSubtotal) {
			orderPredicate.baseSubtotalPrice = {
				range: { gte: updates.minSubtotal },
			};
		}
	}

	const data = await executeSaleorRequest(
		PromotionRuleUpdateDocument,
		{
			id: ruleId,
			input: {
				name: updates.name,
				description: updates.description,
				rewardValueType: updates.discountType,
				rewardValue: updates.discountValue,
				cataloguePredicate,
				orderPredicate,
			},
		},
		context,
	);

	if (data.promotionRuleUpdate?.errors?.length) {
		throw new SaleorPromotionError({
			promotionId: ruleId,
			operation: "updateRule",
			reason: "Rule update failed",
			saleorErrors: data.promotionRuleUpdate.errors,
		});
	}

	return data.promotionRuleUpdate?.promotionRule;
}

/**
 * Delete a promotion
 *
 * WARNING: This removes the promotion from Saleor entirely.
 * Consider updating endDate instead for historical tracking.
 */
export async function deletePromotion(
	promotionId: string,
	context: SaleorContext,
): Promise<{ success: boolean }> {
	const data = await executeSaleorRequest(
		PromotionDeleteDocument,
		{ id: promotionId },
		context,
	);

	if (data.promotionDelete?.errors?.length) {
		throw new SaleorPromotionError({
			promotionId,
			operation: "delete",
			reason: "Promotion deletion failed",
			saleorErrors: data.promotionDelete.errors,
		});
	}

	return { success: true };
}

/**
 * Delete a promotion rule
 *
 * Use this when removing specific discount tiers
 * without deleting the entire promotion
 */
export async function deletePromotionRule(
	ruleId: string,
	context: SaleorContext,
): Promise<{ success: boolean }> {
	const data = await executeSaleorRequest(
		PromotionRuleDeleteDocument,
		{ id: ruleId },
		context,
	);

	if (data.promotionRuleDelete?.errors?.length) {
		throw new SaleorPromotionError({
			promotionId: ruleId,
			operation: "deleteRule",
			reason: "Rule deletion failed",
			saleorErrors: data.promotionRuleDelete.errors,
		});
	}

	return { success: true };
}

/**
 * Create a complete promotion with rules in one go
 *
 * Helper function that combines createPromotion + createPromotionRule
 * Useful for campaign sync operations
 */
export async function createPromotionWithRules(
	input: {
		name: string;
		description?: string;
		startDate: Date;
		endDate?: Date;
		promcoCampaignId?: string;
		rules: PromotionRuleConfig[];
	},
	context: SaleorContext,
): Promise<{ promotion: any; rules: any[] }> {
	// Step 1: Create promotion shell
	const promotion = await createPromotion(
		{
			name: input.name,
			description: input.description,
			startDate: input.startDate,
			endDate: input.endDate,
			promcoCampaignId: input.promcoCampaignId,
		},
		context,
	);

	// Step 2: Create all rules
	const rules: any[] = [];
	for (const ruleConfig of input.rules) {
		const rule = await createPromotionRule(promotion.id, ruleConfig, context);
		rules.push(rule);
	}

	return { promotion, rules };
}
