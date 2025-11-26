import { z } from "zod";
import { ID, Timestamps } from "../shared/base.schema.js";

export const InvoiceMetadataSchema = z
    .object({
        capturesCount: z.number().int().nonnegative().optional(),
        profitGenerated: z.number().optional(),
        activeUsers: z.number().int().nonnegative().optional(),
    })
    .openapi("InvoiceMetadata");

export const InvoiceSchema = z
    .object({
        id: ID,
        organizationId: ID,
        number: z.string().openapi({ example: "INV-2024-001" }),
        periodStart: z.string().datetime(),
        periodEnd: z.string().datetime(),

        // Charges breakdown
        baseCharge: z.number().nonnegative().openapi({
            description: "Monthly subscription base charge",
            example: 5000,
        }),
        outcomeCharge: z.number().nonnegative().default(0).openapi({
            description: "Outcome-based charge (captures/profit)",
            example: 2500,
        }),
        additionalUserCharge: z.number().nonnegative().default(0).openapi({
            description: "Additional user seats charge",
            example: 1000,
        }),
        totalAmount: z.number().nonnegative().openapi({
            description: "Total before tax",
            example: 8500,
        }),
        tax: z.number().nonnegative().default(0).openapi({
            description: "Tax amount",
            example: 1360,
        }),

        // Payment
        status: z
            .enum(["draft", "open", "paid", "void"])
            .default("draft")
            .openapi({ example: "open" }),
        paidAt: z.string().datetime().nullable(),
        dueDate: z.string().datetime(),

        // Metadata
        metadata: InvoiceMetadataSchema.optional(),
    })
    .merge(Timestamps)
    .openapi("Invoice");

export const InvoiceCreateSchema = z
    .object({
        periodStart: z.string().datetime().openapi({
            description: "Start of billing period",
            example: "2024-01-01T00:00:00Z",
        }),
        periodEnd: z.string().datetime().openapi({
            description: "End of billing period",
            example: "2024-01-31T23:59:59Z",
        }),
    })
    .openapi("InvoiceCreate");

export const InvoiceUpdateSchema = z
    .object({
        status: z.enum(["draft", "open", "paid", "void"]).optional(),
        paidAt: z.string().datetime().optional(),
    })
    .openapi("InvoiceUpdate");

export const InvoiceListQuerySchema = z
    .object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(20),
        status: z.enum(["draft", "open", "paid", "void"]).optional(),
        periodStart: z.string().datetime().optional(),
        periodEnd: z.string().datetime().optional(),
        sortBy: z.enum(["number", "dueDate", "totalAmount", "createdAt"]).default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
    })
    .openapi("InvoiceListQuery");

export const InvoiceResponseSchema = InvoiceSchema.openapi("InvoiceResponse");

export const InvoiceListResponseSchema = z
    .object({
        data: z.array(InvoiceResponseSchema),
        pagination: z.object({
            page: z.number(),
            limit: z.number(),
            total: z.number(),
            totalPages: z.number(),
        }),
    })
    .openapi("InvoiceListResponse");

export type Invoice = z.infer<typeof InvoiceSchema>;
export type InvoiceMetadata = z.infer<typeof InvoiceMetadataSchema>;
export type InvoiceCreate = z.infer<typeof InvoiceCreateSchema>;
export type InvoiceUpdate = z.infer<typeof InvoiceUpdateSchema>;
export type InvoiceListQuery = z.infer<typeof InvoiceListQuerySchema>;
export type InvoiceResponse = z.infer<typeof InvoiceResponseSchema>;
export type InvoiceListResponse = z.infer<typeof InvoiceListResponseSchema>;
