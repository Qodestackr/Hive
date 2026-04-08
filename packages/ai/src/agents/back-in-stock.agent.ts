import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { Effect } from "effect";
import { z } from "zod";
import { createError, OrganizationContext } from "@repo/utils";
import { ProfitCalculator } from "@repo/services";
import { inventoryTool } from "../tools/inventory.tool";
import { profitCalculatorTool } from "../tools/profit-calculator.tool";
import { BackInStockContextSchema, ContextEngine } from "../core/context";
import { getPrompt } from "../core/prompts";

const BaseInputSchema = z.object({
	productId: z.string(),
	trigger: z.enum(["saleor_webhook", "inventory_refresh", "manual"]).default("manual"),
	channelPreferences: z
		.array(z.enum(["whatsapp", "sms", "field-reps", "retail-visits", "email"]))
		.default(["whatsapp"]),
	objectives: z
		.array(z.enum(["sell-through", "cashflow", "margin", "awareness"]))
		.default(["sell-through"]),
	maxDiscountPercent: z.number().min(1).max(60).default(15),
});

export const BackInStockAgentUserInputSchema = BaseInputSchema;

export const BackInStockAgentRequestSchema = BaseInputSchema.extend({
	organizationSnapshot: z
		.object({
			id: z.string(),
			name: z.string().nullable(),
			businessType: z.string().nullable(),
			location: z.string().nullable(),
			analyticsSummary: z.string().nullable(),
		})
		.optional(),
});

const InventorySnapshotSchema = z.object({
	productName: z.string(),
	currentStock: z.number(),
	basePrice: z.number(),
	currentFifoCost: z.number(),
	batchId: z.string().nullable(),
	status: z.enum(["IN_STOCK", "OUT_OF_STOCK"]),
});

const AiPlanSchema = z.object({
	promoBrief: z.object({
		headline: z.string(),
		hook: z.string(),
		targetSegment: z.string(),
		channels: z.array(z.string()).min(1),
		discount: z.object({
			type: z.enum(["percentage", "fixed"]),
			value: z.number().min(1),
			rationale: z.string(),
		}),
		callToAction: z.string(),
	}),
	restockPlan: z.object({
		quantity: z.number().int().positive(),
		sellThroughDays: z.number().int().positive(),
		notes: z.string().optional(),
	}),
	talkingPoints: z.array(z.string()).min(1),
	fallbackIdea: z.string().optional(),
});

export const BackInStockAgentResponseSchema = z.object({
	status: z.enum(["SKIPPED", "READY_FOR_REVIEW", "BLOCKED"]),
	reason: z.string().optional(),
	productId: z.string(),
	organizationId: z.string(),
	trigger: z.string(),
	inventorySnapshot: InventorySnapshotSchema,
	context: BackInStockContextSchema,
	proposal: z
		.object({
			promoBrief: AiPlanSchema.shape.promoBrief,
			restockPlan: AiPlanSchema.shape.restockPlan,
			talkingPoints: z.array(z.string()),
			draftOrder: z.object({
				lines: z.array(
					z.object({
						productId: z.string(),
						quantity: z.number().int().positive(),
						saleorVariantId: z.string().nullable(),
					}),
				),
				note: z.string(),
			}),
			safety: z.object({
				estimatedProfit: z.number(),
				profitMargin: z.number(),
				isProfitable: z.boolean(),
			}),
		})
		.optional(),
	diagnostics: z.object({
		model: z.string(),
		latencyMs: z.number(),
		usedTools: z.array(z.string()),
	}),
});

export type BackInStockAgentRequest = z.infer<typeof BackInStockAgentRequestSchema>;
export type BackInStockAgentResponse = z.infer<typeof BackInStockAgentResponseSchema>;

export class BackInStockAgent {
	static runEffect(input: BackInStockAgentRequest) {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			const inventoryResult = (yield* Effect.tryPromise({
				try: () =>
					inventoryTool.execute({
						productId: input.productId,
						organizationId,
					}),
				catch: (error) =>
					createError.internal("Failed to fetch inventory snapshot.", {
						error,
						productId: input.productId,
					}),
			})) as unknown;

			if (!inventoryResult || typeof inventoryResult !== "object") {
				return yield* Effect.fail(
					createError.internal("Inventory tool returned an empty payload.", {
						productId: input.productId,
					}),
				);
			}

			if ("error" in (inventoryResult as Record<string, unknown>)) {
				return yield* Effect.fail(
					createError.conflict("Inventory check failed.", inventoryResult),
				);
			}

			const inventorySnapshot = InventorySnapshotSchema.parse(inventoryResult);

			if (inventorySnapshot.status === "OUT_OF_STOCK" || inventorySnapshot.currentStock <= 0) {
				return {
					status: "SKIPPED",
					reason: "Product is still out of stock; nothing to promote.",
					productId: input.productId,
					organizationId,
					trigger: input.trigger,
					inventorySnapshot,
					context: yield* ContextEngine.buildBackInStockContextEffect({
						productId: input.productId,
						organizationSnapshot: input.organizationSnapshot,
					}),
					diagnostics: {
						model: "n/a",
						latencyMs: 0,
						usedTools: ["inventory"],
					},
				} satisfies BackInStockAgentResponse;
			}

			if (!inventorySnapshot.currentFifoCost || inventorySnapshot.currentFifoCost <= 0) {
				return yield* Effect.fail(
					createError.conflict(
						"Product has no FIFO cost yet. Record a purchase order before running the agent.",
						{ productId: input.productId },
					),
				);
			}

			const context = yield* ContextEngine.buildBackInStockContextEffect({
				productId: input.productId,
				organizationSnapshot: input.organizationSnapshot,
			});

			// Use versioned prompt system (Factor 2: Own Your Prompts)
			const systemPrompt = getPrompt({
				prompt: "backInStock",
				version: "v2", // Stable version
				variables: {
					maxDiscountPercent: input.maxDiscountPercent,
				},
			});

			const requestPayload = {
				context,
				stock: inventorySnapshot,
				preferences: input.channelPreferences,
				objectives: input.objectives,
				maxDiscountPercent: input.maxDiscountPercent,
			};

			const startedAt = Date.now();
			const aiCompletion = yield* Effect.tryPromise({
				try: () =>
					generateObject({
						model: anthropic("claude-3-5-haiku-20241022"),
						schema: AiPlanSchema,
						system: systemPrompt,
						messages: [
							{
								role: "user",
								content: [
									{
										type: "text",
										text: `Generate a back-in-stock promo plan for:\n${JSON.stringify(
											requestPayload,
										)}`,
									},
								],
							},
						],
						tools: {
							inventory: inventoryTool,
							profitCalculator: profitCalculatorTool,
						},
					}),
				catch: (error) =>
					createError.internal("Claude failed to craft a plan.", {
						error,
						productId: input.productId,
					}),
			});

			const latencyMs = Date.now() - startedAt;
			const plan = aiCompletion.object;

			const safety = ProfitCalculator.calculate({
				basePrice: inventorySnapshot.basePrice,
				unitCost: inventorySnapshot.currentFifoCost,
				quantity: plan.restockPlan.quantity,
				discountType: plan.promoBrief.discount.type === "fixed" ? "fixed" : "percentage",
				discountValue: Math.min(
					plan.promoBrief.discount.value,
					input.maxDiscountPercent,
				),
			});

			const status = safety.isProfitable ? "READY_FOR_REVIEW" : "BLOCKED";
			const reason = safety.isProfitable
				? undefined
				: "Profit calculator rejected the plan. Adjust the discount or quantity.";

			const proposal =
				status === "READY_FOR_REVIEW"
					? {
						promoBrief: plan.promoBrief,
						restockPlan: plan.restockPlan,
						talkingPoints: plan.talkingPoints,
						draftOrder: {
							lines: [
								{
									productId: input.productId,
									quantity: plan.restockPlan.quantity,
									saleorVariantId: null,
								},
							],
							note: plan.restockPlan.notes ?? plan.promoBrief.callToAction,
						},
						safety: {
							estimatedProfit: safety.actualProfit,
							profitMargin: safety.profitMargin,
							isProfitable: safety.isProfitable,
						},
					}
					: undefined;

			const usedTools = Array.from(
				new Set(
					((aiCompletion as any)?.toolResults ?? []).map(
						(result: any) => result.toolName ?? result.tool ?? "unknown",
					),
				),
			);

			return {
				status,
				reason,
				productId: input.productId,
				organizationId,
				trigger: input.trigger,
				inventorySnapshot,
				context,
				proposal,
				diagnostics: {
					model: "claude-3-5-haiku-20241022",
					latencyMs,
					usedTools,
				},
			} satisfies BackInStockAgentResponse;
		});
	}
}