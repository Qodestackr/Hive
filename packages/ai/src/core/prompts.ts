/**
 * 12 Factor Agents - Factor 2: Own Your Prompts
 * 
 * Prompts are first-class code. They should be:
 * - Versioned (v1, v2, v3...)
 * - Tested (A/B tests, evals)
 * - Documented (what changed, why)
 * - Measurable (track performance per version)
 * 
 * This enables:
 * - Rollback when a new prompt breaks
 * - Gradual rollouts (10% on v3, 90% on v2)
 * - Clear attribution ("v2 had 85% profit accuracy, v3 has 92%")
 */

import { z } from "zod";

// ============================================================================
// VERSIONED PROMPTS
// ============================================================================

/**
 * BackInStock Agent Prompts
 */
export const BackInStockPrompts = {
    v1: {
        version: "v1",
        deprecated: true,
        deprecationReason: "Too generic, no Kenyan market context",
        system: `You are a promotional campaign assistant. Generate promo ideas for products that are back in stock.`,
    },

    v2: {
        version: "v2",
        active: true,
        introduced: "2024-11-27",
        description: "Added Kenyan liquor context, compliance rules, sandwich pattern instructions",
        system: [
            "You are Promco's BackInStockAgent. You follow the Sandwich Pattern:",
            "1) Always call the inventory tool first (already done).",
            "2) Propose a promo based on provided context.",
            "3) Call the profit calculator tool before finalizing.",
            "",
            "Kenyan Liquor Market Context:",
            "- Distributors lose KES 100K-300K monthly on poorly planned promos",
            "- Age verification is mandatory (18+)",
            "- WhatsApp is the primary engagement channel",
            "- Profit margins typically 20-40% on beer, 30-50% on spirits",
            "",
            "Constraints:",
            "- Max discount: {maxDiscountPercent}%",
            "- Obey Kenyan liquor compliance",
            "- Never hallucinate inventory",
            "- If uncertain, ask for human review",
            "",
            "Outcome-Based Mindset:",
            "We only earn 5% of profit created. Your recommendations must be PROFITABLE.",
        ].join("\n"),
    },

    v3: {
        version: "v3",
        active: false, // A/B testing, not default yet
        introduced: "2024-11-28",
        description: "More aggressive upselling, bundles, margin optimization",
        improvements: [
            "Suggests bundles for slow movers",
            "Optimizes for margin, not just sell-through",
            "Considers seasonal patterns",
        ],
        system: [
            "You are Promco's BackInStockAgent. You follow the Sandwich Pattern:",
            "1) Always call the inventory tool first (already done).",
            "2) Propose a PROFIT-OPTIMIZED promo based on context.",
            "3) Call the profit calculator tool before finalizing.",
            "",
            "Kenyan Liquor Market Context:",
            "- Distributors lose KES 100K-300K monthly on poorly planned promos",
            "- Age verification is mandatory (18+)",
            "- WhatsApp is the primary engagement channel",
            "- Target margins: 25%+ on beer, 35%+ on spirits",
            "",
            "Advanced Strategies:",
            "- For slow movers: Suggest bundles (e.g., 'Buy 2 Tusker, get 1 free')",
            "- For high-margin items: Smaller discounts (5-10%) to preserve margin",
            "- For seasonal items: Push hard before expiry (higher discounts ok)",
            "",
            "Constraints:",
            "- Max discount: {maxDiscountPercent}%",
            "- Obey Kenyan liquor compliance",
            "- Never hallucinate inventory",
            "- Prioritize PROFIT MARGIN over volume",
            "",
            "Outcome-Based Mindset:",
            "We only earn 5% of profit created. Your recommendations must MAXIMIZE margin.",
        ].join("\n"),
    },
} as const;

/**
 * Promo Redemption Agent Prompts
 */
export const PromoRedemptionPrompts = {
    v1: {
        version: "v1",
        active: true,
        introduced: "2024-11-28",
        description: "Extract promo codes from natural language (Swahili/English mix)",
        system: [
            "You are a promo code extractor for Kenyan liquor distributors.",
            "",
            "Rules:",
            "1. Promo codes are UPPERCASE + numbers (e.g., TUSKER50, HENNESSY20)",
            "2. Extract phone in E.164 format (+254...)",
            "3. Handle Swahili/English code-switching",
            "4. Return JSON only",
            "",
            "Examples:",
            '- "Nina code TUSKER50" → {"code": "TUSKER50"}',
            '- "Nataka discount, my number ni 0700123456" → {"phone": "+254700123456"}',
            '- "BEER20 for 0722555666" → {"code": "BEER20", "phone": "+254722555666"}',
            "",
            "Important:",
            "- If you can't extract a valid code, return null",
            "- Never guess or hallucinate codes",
            "- Phone numbers can be 07XX... or +2547XX...",
        ].join("\n"),
    },
} as const;

/**
 * Campaign Health Agent Prompts
 */
export const CampaignHealthPrompts = {
    v1: {
        version: "v1",
        active: true,
        introduced: "2024-11-28",
        description: "Analyze campaign profitability and provide recommendations",
        system: [
            "You are Promco's CampaignHealthAgent. Your job:",
            "1. Analyze campaign profit/loss data",
            "2. Classify health: PROFITABLE, BREAK_EVEN, LOSING_MONEY",
            "3. Recommend actionable fixes",
            "",
            "Classification Rules:",
            "- PROFITABLE: Profit margin > 10% AND positive profit",
            "- BREAK_EVEN: Profit margin 0-10%",
            "- LOSING_MONEY: Negative profit",
            "",
            "Recommendations:",
            "- For LOSING_MONEY: Suggest stopping campaign or reducing discount",
            "- For BREAK_EVEN: Suggest small tweaks (5% discount reduction)",
            "- For PROFITABLE: Suggest scaling up or replicating to similar products",
            "",
            "Context:",
            "Distributors trust us because we tell them when to STOP, not just when to go.",
        ].join("\n"),
    },
} as const;

// ============================================================================
// PROMPT SELECTION LOGIC
// ============================================================================

export type PromptKey = "backInStock" | "promoRedemption" | "campaignHealth";

const PROMPT_REGISTRY = {
    backInStock: BackInStockPrompts,
    promoRedemption: PromoRedemptionPrompts,
    campaignHealth: CampaignHealthPrompts,
} as const;

export interface GetPromptOptions {
    /**
     * Prompt category (e.g., 'backInStock')
     */
    prompt: PromptKey;

    /**
     * Specific version to use (e.g., 'v2')
     * If not provided, uses the active version
     */
    version?: string;

    /**
     * A/B test group (e.g., 'control', 'variant_a')
     * If provided and matches a testing config, uses the variant
     */
    abTestGroup?: string;

    /**
     * Variables to interpolate into prompt (e.g., {maxDiscountPercent: 15})
     */
    variables?: Record<string, string | number>;
}

/**
 * Get a prompt, with version resolution and interpolation
 * 
 * @example
 * ```typescript
 * const prompt = getPrompt({
 *   prompt: 'backInStock',
 *   version: 'v2', // optional, uses active if not provided
 *   variables: { maxDiscountPercent: 15 }
 * });
 * ```
 */
export function getPrompt(options: GetPromptOptions): string {
    const { prompt, version, variables = {} } = options;

    const promptVersions = PROMPT_REGISTRY[prompt];

    // Resolve version
    let selectedVersion = version;
    if (!selectedVersion) {
        // Find the active version
        selectedVersion = Object.keys(promptVersions).find(
            (v) => (promptVersions as any)[v].active
        );
    }

    if (!selectedVersion) {
        throw new Error(
            `No active version found for prompt '${prompt}'. Specify a version explicitly.`
        );
    }

    const promptData = (promptVersions as any)[selectedVersion];

    if (!promptData) {
        throw new Error(`Prompt version '${selectedVersion}' not found for '${prompt}'.`);
    }

    if (promptData.deprecated) {
        console.warn(
            `⚠️  Using deprecated prompt ${prompt}:${selectedVersion}. Reason: ${promptData.deprecationReason}`
        );
    }

    // Interpolate variables
    let finalPrompt = promptData.system;
    for (const [key, value] of Object.entries(variables)) {
        finalPrompt = finalPrompt.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
    }

    return finalPrompt;
}

/**
 * Get metadata about a prompt version (for logging/evals)
 */
export function getPromptMetadata(prompt: PromptKey, version: string) {
    const promptVersions = PROMPT_REGISTRY[prompt];
    const promptData = (promptVersions as any)[version];

    if (!promptData) {
        return null;
    }

    return {
        version: promptData.version,
        active: promptData.active ?? false,
        deprecated: promptData.deprecated ?? false,
        introduced: promptData.introduced,
        description: promptData.description,
    };
}

// ============================================================================
// A/B TESTING CONFIG (Future)
// ============================================================================

/**
 * A/B Test Configuration
 * 
 * Example:
 * - Control group: uses v2
 * - Variant A: uses v3 (testing new bundle suggestions)
 * 
 * Measured metrics: profit accuracy, HITL approval rate, customer satisfaction
 */
export const AB_TEST_CONFIG = {
    backInStockBundleTest: {
        enabled: false, // Set to true when running test
        control: { version: "v2", allocation: 0.9 }, // 90% on stable v2
        variantA: { version: "v3", allocation: 0.1 }, // 10% on experimental v3
        metrics: ["profitAccuracy", "hitlApprovalRate", "avgMarginPercent"],
    },
} as const;

/**
 * Example usage in agent:
 * 
 * ```typescript
 * const systemPrompt = getPrompt({
 *   prompt: 'backInStock',
 *   variables: { maxDiscountPercent: input.maxDiscountPercent },
 *   abTestGroup: organizationId % 10 === 0 ? 'variantA' : 'control'
 * });
 * ```
 */