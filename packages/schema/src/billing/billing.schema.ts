import { z } from "zod";

// ============================================================================
// OUTCOME-BASED BILLING SCHEMAS
// ============================================================================

export const OutcomeInvoiceGenerateSchema = z.object({
    periodStart: z.string().datetime(),
    periodEnd: z.string().datetime(),
}).openapi('OutcomeInvoiceGenerate');

export const OutcomeInvoiceSchema = z.object({
    id: z.string(),
    invoiceNumber: z.string(),
    periodStart: z.string().datetime(),
    periodEnd: z.string().datetime(),

    // Charges breakdown
    baseCharge: z.number().nonnegative(),
    captureCharge: z.number().nonnegative(),
    profitShareCharge: z.number().nonnegative(),
    totalAmount: z.number().nonnegative(),
    tax: z.number().nonnegative().default(0),
    amountDue: z.number().nonnegative(), // Total amount to be paid (totalAmount + tax)

    // Outcome metrics
    capturesCount: z.number().int().nonnegative(),
    profitGenerated: z.number(),

    // Campaign breakdown
    campaignBreakdown: z.array(z.object({
        campaignId: z.string(),
        name: z.string(),
        captures: z.number().int().nonnegative(),
        conversions: z.number().int().nonnegative(),
        revenue: z.number().nonnegative(),
        discountCost: z.number().nonnegative(),
        profit: z.number(),
    })),

    // Pricing model (frozen at billing time)
    pricingSnapshot: z.object({
        pricingVersion: z.string(),
        basePrice: z.number().nonnegative(),
        outcomeBasePer1000Captures: z.number().nonnegative(),
        outcomeProfitSharePercent: z.number().nonnegative(),
    }),

    status: z.enum(['draft', 'open', 'paid', 'void']),
    dueDate: z.string().datetime(),
    createdAt: z.string().datetime(),
}).openapi('OutcomeInvoice');

export const OutcomeInvoiceListQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    status: z.enum(['draft', 'open', 'paid', 'void']).optional(),
}).openapi('OutcomeInvoiceListQuery');

export const OutcomeInvoiceListResponseSchema = z.object({
    data: z.array(OutcomeInvoiceSchema),
    pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
    }),
}).openapi('OutcomeInvoiceListResponse');

// Type exports
export type OutcomeInvoiceGenerate = z.infer<typeof OutcomeInvoiceGenerateSchema>;
export type OutcomeInvoice = z.infer<typeof OutcomeInvoiceSchema>;
export type OutcomeInvoiceListQuery = z.infer<typeof OutcomeInvoiceListQuerySchema>;
export type OutcomeInvoiceListResponse = z.infer<typeof OutcomeInvoiceListResponseSchema>;
