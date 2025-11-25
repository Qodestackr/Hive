import { z } from "zod";
import { ID, Timestamps } from "../shared/base.schema.js";
import { PurchaseOrderStatus } from "../shared/enums.schema.js";

// ============================================================================
// PURCHASE ORDER SCHEMAS (THE GOLD - FIFO Cost Tracking)
// ============================================================================

/**
 * Purchase order item schema (FIFO batch)
 */
export const PurchaseOrderItemSchema = z
    .object({
        id: z.string(),
        purchaseOrderId: z.string(),
        productId: z.string(),

        // Quantity tracking
        quantityOrdered: z.number().int().positive(),
        quantityReceived: z.number().int().nonnegative().default(0),

        // THE GOLD: Unit cost at purchase time
        unitCost: z.number().nonnegative(),

        // Batch tracking
        batchNumber: z.string().nullable(),
        expiryDate: z.string().datetime().nullable(),

        // Calculated
        lineTotal: z.number().nonnegative(),
    })
    .merge(Timestamps)
    .openapi('PurchaseOrderItem');

/**
 * Purchase order schema
 */
export const PurchaseOrderSchema = z
    .object({
        id: z.string(),
        organizationId: z.string(),

        // PO details
        poNumber: z.string(),
        supplierName: z.string().nullable(),
        supplierContact: z.string().nullable(),

        // Status
        status: PurchaseOrderStatus,

        // Dates
        orderDate: z.string().datetime(),
        receivedDate: z.string().datetime().nullable(),

        // Financials
        totalCost: z.number().nonnegative(),
        currency: z.string().length(3).default("KES"),

        // Metadata
        notes: z.string().nullable(),
        metadata: z.record(z.string(), z.any()).nullable(),

        // Relations (populated when needed)
        items: z.array(PurchaseOrderItemSchema).optional(),
    })
    .merge(Timestamps)
    .openapi('PurchaseOrder');

/**
 * Purchase order item create input
 */
export const PurchaseOrderItemCreateSchema = z.object({
    productId: z.string().min(1, "Product ID is required").openapi({ example: 'prod_123' }),
    quantityOrdered: z.number().int().positive("Quantity must be positive").openapi({ example: 50 }),
    quantityReceived: z.number().int().nonnegative().optional().openapi({ example: 50 }),
    unitCost: z.number().nonnegative("Unit cost must be non-negative").openapi({ example: 9200 }),
    batchNumber: z.string().optional().openapi({ example: 'BATCH-2025-001' }),
    expiryDate: z.string().datetime().optional(),
}).openapi('PurchaseOrderItemCreate');

/**
 * Purchase order create input (manual stock entry)
 */
export const PurchaseOrderCreateSchema = z.object({
    supplierName: z.string().optional().openapi({ example: 'ABC Distributors' }),
    supplierContact: z.string().optional().openapi({ example: '+254712345678' }),
    orderDate: z.string().datetime().optional(), // Defaults to now
    receivedDate: z.string().datetime().optional(),
    notes: z.string().optional(),

    // Line items
    items: z
        .array(PurchaseOrderItemCreateSchema)
        .min(1, "At least one item is required"),
}).openapi('PurchaseOrderCreate');

/**
 * Quick stock arrival form (simplified for UX)
 */
export const QuickStockArrivalSchema = z.object({
    productId: z.string().min(1, "Product is required").openapi({ example: 'prod_123' }),
    quantity: z.number().int().positive("Quantity must be positive").openapi({ example: 50 }),
    unitCost: z.number().nonnegative("Unit cost must be non-negative").openapi({ example: 9200 }),
    supplierName: z.string().optional().openapi({ example: 'ABC Distributors' }),
    batchNumber: z.string().optional().openapi({ example: 'BATCH-2025-001' }),
    expiryDate: z.string().datetime().optional(),
}).openapi('QuickStockArrival');

/**
 * Purchase order update input
 */
export const PurchaseOrderUpdateSchema = z.object({
    status: PurchaseOrderStatus.optional(),
    receivedDate: z.string().datetime().optional(),
    notes: z.string().optional(),
}).openapi('PurchaseOrderUpdate');

/**
 * Purchase order list query params
 */
export const PurchaseOrderListQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    status: PurchaseOrderStatus.optional(),
    supplierName: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    sortBy: z.enum(["poNumber", "orderDate", "receivedDate", "totalCost", "createdAt"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
}).openapi('PurchaseOrderListQuery');

/**
 * Purchase order response
 */
export const PurchaseOrderResponseSchema = PurchaseOrderSchema.openapi('PurchaseOrderResponse');

/**
 * Purchase order list response
 */
export const PurchaseOrderListResponseSchema = z.object({
    data: z.array(PurchaseOrderResponseSchema),
    pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
    }),
}).openapi('PurchaseOrderListResponse');

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type PurchaseOrderItem = z.infer<typeof PurchaseOrderItemSchema>;
export type PurchaseOrder = z.infer<typeof PurchaseOrderSchema>;
export type PurchaseOrderItemCreate = z.infer<typeof PurchaseOrderItemCreateSchema>;
export type PurchaseOrderCreate = z.infer<typeof PurchaseOrderCreateSchema>;
export type QuickStockArrival = z.infer<typeof QuickStockArrivalSchema>;
export type PurchaseOrderUpdate = z.infer<typeof PurchaseOrderUpdateSchema>;
export type PurchaseOrderListQuery = z.infer<typeof PurchaseOrderListQuerySchema>;
export type PurchaseOrderResponse = z.infer<typeof PurchaseOrderResponseSchema>;
export type PurchaseOrderListResponse = z.infer<typeof PurchaseOrderListResponseSchema>;
