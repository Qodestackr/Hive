import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { Effect } from "effect";
import { z } from "zod";
import { createError, OrganizationContext } from "@repo/utils";
import { getPrompt } from "../core/prompts";

const NegotiationScriptSchema = z.object({
    targetDiscount: z.number().min(0).max(10),
    reasoning: z.string(),
    negotiationScript: z.string(),
    fallbackPosition: z.string(),
});

export class NegotiationIntelTool {
    static async execute(input: {
        volume: number;
        revenue: number;
        redemptionRate: number;
        nationalPercentile: number;
        productName: string;
        currentPrice?: number;
        organizationId: string;
    }) {
        const systemPrompt = getPrompt({
            prompt: "negotiationIntel",
            version: "v1",
        });

        const userPrompt = `
Generate negotiation intel for:

Product: ${input.productName}
Performance (Last 90 Days):
- Volume moved: ${input.volume} units
- Revenue: KES ${input.revenue.toLocaleString()}
- Redemption rate: ${input.redemptionRate}%
- National rank: Top ${input.nationalPercentile}%

${input.currentPrice ? `Current supplier price: KES ${input.currentPrice}/unit` : ""}

Return:
1. Target discount % to request
2. Reasoning (why this discount is justified)
3. Complete negotiation script (2-3 paragraphs, direct tone)
4. Fallback position if declined
`;

        try {
            const result = await generateText({
                model: anthropic("claude-3-5-haiku-20241022"),
                system: systemPrompt,
                prompt: userPrompt,
            });

            const lines = result.text.split("\n").filter((l) => l.trim());
            const targetDiscountLine = lines.find((l) =>
                l.toLowerCase().includes("target discount"),
            );
            const targetDiscount = targetDiscountLine
                ? parseFloat(targetDiscountLine.match(/[\d.]+/)?.[0] || "2")
                : this.calculateDefaultDiscount(input.nationalPercentile);

            return {
                targetDiscount,
                reasoning: result.text,
                negotiationScript: result.text,
                fallbackPosition:
                    "If price discount is declined, request co-op funding for promotional campaigns instead.",
            };
        } catch (error) {
            throw new Error(`Negotiation intel generation failed: ${error}`);
        }
    }

    private static calculateDefaultDiscount(percentile: number): number {
        if (percentile <= 5) return 4.5;
        if (percentile <= 10) return 3.5;
        if (percentile <= 25) return 2.5;
        if (percentile <= 50) return 1.5;
        return 0;
    }

    static runEffect(input: {
        volume: number;
        revenue: number;
        redemptionRate: number;
        nationalPercentile: number;
        productName: string;
        currentPrice?: number;
    }) {
        return Effect.gen(function* () {
            const { organizationId } = yield* OrganizationContext;

            const result = yield* Effect.tryPromise({
                try: () =>
                    NegotiationIntelTool.execute({
                        ...input,
                        organizationId,
                    }),
                catch: (error) =>
                    createError.internal("Negotiation intel tool failed", { error }),
            });

            return result;
        });
    }
}
