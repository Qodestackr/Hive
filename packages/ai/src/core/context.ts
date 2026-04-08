import { z } from "zod";
import { Effect } from "effect";
import { OrganizationContext } from "@repo/utils";
import { productService } from "@repo/services";

export const BackInStockContextSchema = z.object({
	product: z.object({
		id: z.string(),
		name: z.string(),
		category: z.string().nullable(),
		basePrice: z.number(),
		fifoCost: z.number().nullable(),
		currentStock: z.number().nullable(),
		isSlowMover: z.boolean().nullable(),
		tags: z.array(z.string()).optional(),
	}),
	organization: z
		.object({
			id: z.string(),
			name: z.string().nullable(),
			businessType: z.string().nullable(),
			location: z.string().nullable(),
			analyticsSummary: z.string().nullable(),
		})
		.optional(),
	heuristics: z.object({
		targetSellThroughDays: z.number(),
		minMarginPercent: z.number(),
		pricingReminder: z.string(),
	}),
	pastPerformance: z.array(
		z.object({
			campaignId: z.string(),
			name: z.string(),
			status: z.string(),
			isProfitable: z.boolean().nullable(),
			startedAt: z.string().nullable(),
		}),
	),
	knowledgeGaps: z.array(z.string()),
});

export type BackInStockContext = z.infer<typeof BackInStockContextSchema>;

interface BuildBackInStockContextArgs {
	productId: string;
	organizationSnapshot?: {
		id: string;
		name?: string | null;
		businessType?: string | null;
		location?: string | null;
		analyticsSummary?: string | null;
	};
}

export const ContextEngine = {
	buildBackInStockContextEffect: ({
		productId,
		organizationSnapshot,
	}: BuildBackInStockContextArgs) =>
		Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;
			const product = yield* productService.getByIdEffect(productId);

			return {
				product: {
					id: product.id,
					name: product.name,
					category: product.category ?? null,
					basePrice: product.basePrice,
					fifoCost: product.currentFIFOCost ?? null,
					currentStock: product.currentStockQuantity ?? null,
					isSlowMover: product.isSlowMover ?? null,
					tags: product.tags ?? [],
				},
				organization:
					organizationSnapshot ?? ({
						id: organizationId,
						name: null,
						businessType: null,
						location: null,
						analyticsSummary: null,
					} as const),
				heuristics: {
					targetSellThroughDays: product.isSlowMover ? 21 : 14,
					minMarginPercent: 10,
					pricingReminder:
						"Outcome-based pricing: we only earn when this promo makes real profit.",
				},
				pastPerformance: [], // Hook promo-history.tool when ready
				knowledgeGaps: [
					"Promo history + KB insights not wired yet; rely on deterministic services.",
					"Need upcoming customer demand signals before recommending bundles.",
				],
			} satisfies BackInStockContext;
		}),
};