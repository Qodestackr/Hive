import { z } from "zod";

export const NegotiationIntelQuerySchema = z.object({
    productId: z.string(),
    brandId: z.string().optional(),
});

export const NegotiationIntelResponseSchema = z.object({
    performance: z.object({
        volume: z.number(),
        revenue: z.number(),
        redemptionRate: z.number(),
        nationalPercentile: z.number(),
        periodDays: z.number(),
    }),
    currentSupplierPrice: z.number().optional(),
    suggestedNegotiation: z.object({
        targetPrice: z.number(),
        discountPercentage: z.number(),
        reasoning: z.string(),
    }),
    fallbackPosition: z.string(),
    negotiationScript: z.string(),
});

export const MarketIntelQuerySchema = z.object({
    brandId: z.string(),
    region: z.string(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
});

export const SupplierSubscriptionCreateSchema = z.object({
    organizationId: z.string(),
    accessLevel: z.enum(["brand", "category", "full"]),
    brandsAllowed: z.array(z.string()).optional(),
    categoriesAllowed: z.array(z.string()).optional(),
    monthlyFee: z.number().positive(),
});
