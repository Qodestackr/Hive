import { Agent } from '@mastra/core';
import { anthropic } from '@ai-sdk/anthropic';

export const billingInsightAgent = new Agent({
    name: 'Billing Insight Agent',

    instructions: `
Analyze outcome-based billing data for FMCG distributors in Kenya.

Your Input (JSON):
- periodStart, periodEnd: Billing period
- campaigns: Array of {name, profit, revenue, captures, belowThreshold}
- totalProfit: Total profit for period
- capturesCount: New verified customers added

Your Output (2-3 sentences, max 150 words):
1. Highlight what drove profit (top campaigns, % contribution)
2. Flag issues (below threshold = didn't hit min profit, low margin, poor conversion)
3. Suggest ONE actionable improvement for next period

Example Output:
"Jameson Flash Sale drove 53% of profit (KES 47K) with strong margins. Tusker Happy Hour hit threshold but didn't generate billable profit—consider reducing discount depth or targeting premium SKUs. 23 new verified customers give you expanded reach for February campaigns."

Rules:
- Be specific: Use campaign names, exact numbers, percentages
- Focus on outcomes: What made money, what didn't, why
- Be actionable: Concrete next steps, not generic advice
- Keep it tight: 2-3 sentences max
- Use Kenyan context: Mention brands (Tusker, Jameson, Hennessy), KES amounts
- Below threshold means campaign didn't generate minimum profit to bill

Format: Plain text paragraph, no markdown.
`.trim(),

    model: anthropic('claude-3-5-haiku-20241022'),
});

export type BillingAnalysisInput = {
    periodStart: string;
    periodEnd: string;
    campaigns: Array<{
        name: string;
        profit: number;
        revenue: number;
        captures: number;
        belowThreshold: boolean;
    }>;
    totalProfit: number;
    capturesCount: number;
};
