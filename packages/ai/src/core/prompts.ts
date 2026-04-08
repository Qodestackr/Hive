/**
 * Prompts Registry - Production Grade
 * 
 * Principles:
 * 1. Prompts are contracts - breaking changes need new versions
 * 2. Metadata enables monitoring - track what version caused what outcome
 * 3. Gradual rollout - canary/A/B test before full deployment
 */

import { z } from 'zod';

// Schema for prompt metadata
const PromptVersionSchema = z.object({
    active: z.boolean(),
    rollout: z.number().min(0).max(100).default(100), // % traffic
    deprecated: z.string().optional(),
    improvements: z.string().optional(),
    system: z.string(),
    metrics: z.object({
        successRate: z.number().optional(),
        avgLatency: z.number().optional(),
        costPerRun: z.number().optional(),
    }).optional(),
});

type PromptVersion = z.infer<typeof PromptVersionSchema>;

// Core prompts with rollout control
export const BackInStockPrompts = {
    v1: {
        active: false,
        rollout: 0,
        deprecated: "Too generic, no market context",
        metrics: { successRate: 0.65, avgLatency: 2300, costPerRun: 0.008 },
        system: `You are a promotional campaign assistant. Generate promo ideas for products that are back in stock.`,
    },

    v2: {
        active: true,
        rollout: 80, // Gradual rollout
        metrics: { successRate: 0.82, avgLatency: 2100, costPerRun: 0.009 },
        system: [
            "You're Promco's BackInStockAgent. Follow the Sandwich Pattern:",
            "1. Inventory tool already called",
            "2. Propose promo",
            "3. Validate with profit calculator",
            "",
            "Market Reality:",
            "- Distributors lose KES 100K-300K/month on bad promos",
            "- Typical margins: 20-40% beer, 30-50% spirits",
            "- WhatsApp is primary channel, 18+ age gate required",
            "",
            "Rules:",
            "- Max discount: {maxDiscountPercent}%",
            "- If margin < 10%, flag for review",
            "- Never hallucinate inventory",
            "",
            "We earn 5% of profit created. Prioritize profitability over volume.",
        ].join("\n"),
    },

    v3: {
        active: true,
        rollout: 20, // A/B test
        improvements: "Bundle suggestions, margin optimization, seasonal awareness",
        system: [
            "You're Promco's BackInStockAgent. Follow the Sandwich Pattern:",
            "1. Inventory tool already called",
            "2. Propose MARGIN-OPTIMIZED promo (bundles for slow movers)",
            "3. Validate with profit calculator",
            "",
            "Market Reality:",
            "- Distributors lose KES 100K-300K/month on bad promos",
            "- Target margins: 25%+ beer, 35%+ spirits",
            "- WhatsApp channel, 18+ gate",
            "",
            "Strategy:",
            "- Slow movers: Bundles (Buy 2 get 1) - clears inventory + maintains margin",
            "- High margin: Small discounts (5-10%) - volume play",
            "- Near expiry: Aggressive discounts - salvage value",
            "",
            "Rules:",
            "- Max discount: {maxDiscountPercent}%",
            "- If margin < 15%, flag for review",
            "- Never hallucinate inventory",
            "",
            "We earn 5% of profit created. Maximize margin, not volume.",
        ].join("\n"),
    },
} as const;

export const PromoRedemptionPrompts = {
    v1: {
        active: false,
        rollout: 0,
        deprecated: "No validation logic, too permissive on edge cases",
        metrics: { successRate: 0.71, avgLatency: 1800, costPerRun: 0.006 },
        system: [
            "Extract promo codes from Kenyan customer messages (Swahili/English mix).",
            "",
            "Format:",
            "- Codes: UPPERCASE + numbers (TUSKER50, BEER20)",
            "- Phone: E.164 format (+254...)",
            "",
            "Examples:",
            '"Nina code TUSKER50" → {"code": "TUSKER50"}',
            '"Nataka discount, 0700123456" → {"phone": "+254700123456"}',
            "",
            "Return JSON only. If unclear, return null.",
        ].join("\n"),
    },

    v2: {
        active: true,
        rollout: 100,
        improvements: "Validation logic, handles edge cases, Sheng support",
        metrics: { successRate: 0.89, avgLatency: 1900, costPerRun: 0.007 },
        system: [
            "Extract promo codes from Kenyan customer messages.",
            "",
            "Valid Code Format:",
            "- 4-15 chars, UPPERCASE + numbers only",
            "- Common patterns: TUSKER50, BEER20, MEGA25",
            "- NOT valid: emoji, special chars, spaces",
            "",
            "Phone Numbers:",
            "- Kenyan: 07XX, 01XX → normalize to +254",
            "- Already E.164: keep as-is",
            "",
            "Language Support:",
            "- English: 'I have code X'",
            "- Swahili: 'Nina code X', 'Nataka discount'",
            "- Sheng: 'Niko na code', 'Nionyeshe deal'",
            "",
            "Edge Cases:",
            "- Typos: 'TUSKER5O' (O vs 0) → try correcting if confident",
            "- Multiple codes: extract first valid only",
            "- No code found: return {code: null, confidence: 0}",
            "",
            "Return JSON with confidence score (0-1).",
        ].join("\n"),
    },
} as const;

export const CampaignHealthPrompts = {
    v1: {
        active: true,
        rollout: 100,
        system: [
            "Analyze campaign profitability. Classify as:",
            "- PROFITABLE: margin > 10%, positive profit",
            "- BREAK_EVEN: margin 0-10%",
            "- LOSING_MONEY: negative profit",
            "",
            "Recommendations:",
            "- LOSING_MONEY: Stop immediately or reduce discount by 50%+",
            "- BREAK_EVEN: Reduce discount 5-10%",
            "- PROFITABLE: Scale or replicate pattern",
            "",
            "Context: Distributors trust us because we tell them when to STOP.",
            "Include: expected profit change, timeline to profitability if adjusting.",
        ].join("\n"),
    },
} as const;

export const NegotiationIntelPrompts = {
    v1: {
        active: true,
        rollout: 100,
        system: [
            "You generate negotiation scripts for liquor distributors.",
            "",
            "Context:",
            "- Distributors in Kenya negotiate stock prices with suppliers (Diageo, EABL, Pernod Ricard)",
            "- Most distributors don't know their performance vs competitors",
            "- Promco tracks actual redemption data proving distributor value",
            "",
            "Your job:",
            "1. Analyze distributor's performance data",
            "2. Calculate their percentile rank (top 5%, top 25%, etc.)",
            "3. Suggest a target discount percentage",
            "4. Generate a confident negotiation script in Kenyan business tone",
            "",
            "Negotiation Formula:",
            "- Top 5%: Ask for 3-5% volume discount",
            "- Top 10-25%: Ask for 2-3% discount",
            "- Top 25-50%: Ask for 1-2% discount or co-op funding",
            "- Below 50%: Focus on co-op funding, not price discount",
            "",
            "Script Structure:",
            "1. Lead with data (volume moved, redemption rate)",
            "2. Position as top performer",
            "3. Make the ask (specific % discount)",
            "4. Justify with mutual benefit (shelf placement, guaranteed orders)",
            "",
            "Tone: Professional but direct. Use Kenyan business language.",
            "Avoid: Being apologetic, vague asks, complex jargon",
        ].join("\n"),
    },
} as const;

const REGISTRY = {
    backInStock: BackInStockPrompts,
    promoRedemption: PromoRedemptionPrompts,
    campaignHealth: CampaignHealthPrompts,
    negotiationIntel: NegotiationIntelPrompts,
} as const;

type PromptKey = keyof typeof REGISTRY;

interface GetPromptOpts {
    prompt: PromptKey;
    version?: string;
    variables?: Record<string, string | number>;
    userId?: string; // For A/B bucketing
}

// Simple hash for consistent A/B bucketing
function hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = ((hash << 5) - hash) + userId.charCodeAt(i);
        hash = hash & hash;
    }
    return Math.abs(hash) % 100;
}

export function getPrompt(opts: GetPromptOpts): string {
    const { prompt, version, variables = {}, userId } = opts;
    const versions = REGISTRY[prompt];

    let selectedVersion: string;

    if (version) {
        selectedVersion = version;
    } else {
        // Get active versions with rollout
        const activeVersions = Object.entries(versions)
            .filter(([_, v]) => (v as PromptVersion).active)
            .sort(([_, a], [__, b]) =>
                ((b as PromptVersion).rollout || 0) - ((a as PromptVersion).rollout || 0)
            );

        if (activeVersions.length === 0) {
            throw new Error(`No active version for '${prompt}'`);
        }

        // A/B test if multiple active versions + userId provided
        if (activeVersions.length > 1 && userId) {
            const bucket = hashUserId(userId);
            let cumulative = 0;

            for (const [ver, meta] of activeVersions) {
                cumulative += (meta as PromptVersion).rollout || 0;
                if (bucket < cumulative) {
                    selectedVersion = ver;
                    break;
                }
            }

            selectedVersion = selectedVersion! || activeVersions[0][0];
        } else {
            selectedVersion = activeVersions[0][0];
        }
    }

    const selected = (versions as any)[selectedVersion];

    if (!selected) {
        throw new Error(`Version '${selectedVersion}' not found for '${prompt}'`);
    }

    if (selected.deprecated) {
        console.warn(`⚠️  ${prompt}:${selectedVersion} deprecated: ${selected.deprecated}`);
    }

    let result = selected.system;
    for (const [key, val] of Object.entries(variables)) {
        result = result.replace(new RegExp(`\\{${key}\\}`, "g"), String(val));
    }

    return result;
}

export function getPromptMeta(prompt: PromptKey, version: string) {
    const selected = (REGISTRY[prompt] as any)[version];
    return selected ? {
        version,
        active: selected.active ?? false,
        rollout: selected.rollout ?? 100,
        deprecated: selected.deprecated,
        improvements: selected.improvements,
        metrics: selected.metrics,
    } : null;
}

// Helper for monitoring - log which version was used
export function logPromptUsage(
    prompt: PromptKey,
    version: string,
    outcome: { success: boolean; latency: number; cost?: number }
) {
    // Wire to your observability stack
    console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        prompt,
        version,
        ...outcome,
    }));
}