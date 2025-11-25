import { z } from "zod";
import { ID, Timestamps } from "../shared/base.schema.js";
import { InventoryMovementType } from "../shared/enums.schema.js";

// ============================================================================
// INVENTORY MOVEMENT SCHEMAS (FIFO Tracking)
// ============================================================================

/**
 * Inventory movement schema (every stock change)
 */
export const InventoryMovementSchema = z.object({
    id: z.string(),
    organizationId: z.string(),
    productId: z.string(),

    // Movement details
    movementType: InventoryMovementType,
    quantity: z.number().int(),

    // FIFO cost tracking (THE KEY TO PROFIT CALCULATION)
    unitCostAtMovement: z.number().nonnegative(),
    totalCost: z.number().nonnegative(),

    // FIFO batch tracking
    fifoBatchId: z.string().nullable(),

    // References (what triggered this movement)
    referenceType: z.string().nullable(),
    referenceId: z.string().nullable(),
    campaignId: z.string().nullable(),
    promoCodeId: z.string().nullable(),

    // Stock levels after movement
    stockAfterMovement: z.number().int().nonnegative(),

    // Metadata
    notes: z.string().nullable(),
    metadata: z.record(z.string(), z.any()).nullable(),

    createdAt: z.string().datetime(),
}).openapi('InventoryMovement');

/**
 * Inventory movement create input
 */
export const InventoryMovementCreateSchema = z.object({
    productId: z.string().min(1, "Product ID is required").openapi({ example: 'prod_123' }),
    movementType: InventoryMovementType,
    quantity: z.number().int().refine((val) => val !== 0, {
        message: "Quantity cannot be zero",
    }).openapi({ example: -5 }),
    notes: z.string().optional().openapi({ example: 'Damaged bottles removed' }),
    referenceType: z.string().optional(),
    referenceId: z.string().optional(),
}).openapi('InventoryMovementCreate');

/**
 * Inventory movement list query params
 */
export const InventoryMovementListQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    productId: z.string().optional(),
    movementType: InventoryMovementType.optional(),
    campaignId: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    sortBy: z.enum(["createdAt", "quantity", "totalCost"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
}).openapi('InventoryMovementListQuery');

/**
 * Inventory movement response
 */
export const InventoryMovementResponseSchema = InventoryMovementSchema.openapi('InventoryMovementResponse');

/**
 * Inventory movement list response
 */
export const InventoryMovementListResponseSchema = z.object({
    data: z.array(InventoryMovementResponseSchema),
    pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
    }),
}).openapi('InventoryMovementListResponse');

/**
 * FIFO batch info (for debugging/transparency)
 */
export const FIFOBatchInfoSchema = z.object({
    batchId: z.string(),
    productId: z.string(),
    unitCost: z.number().nonnegative(),
    quantityRemaining: z.number().int().nonnegative(),
    purchaseDate: z.string().datetime(),
    batchNumber: z.string().nullable(),
    expiryDate: z.string().datetime().nullable(),
}).openapi('FIFOBatchInfo');

/**
 * Product FIFO batches response (show all batches for a product)
 */
export const ProductFIFOBatchesResponseSchema = z.object({
    productId: z.string(),
    productName: z.string(),
    currentFIFOCost: z.number().nonnegative().nullable(),
    totalStockQuantity: z.number().int().nonnegative(),
    batches: z.array(FIFOBatchInfoSchema),
}).openapi('ProductFIFOBatchesResponse');

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type InventoryMovement = z.infer<typeof InventoryMovementSchema>;
export type InventoryMovementCreate = z.infer<typeof InventoryMovementCreateSchema>;
export type InventoryMovementListQuery = z.infer<typeof InventoryMovementListQuerySchema>;
export type InventoryMovementResponse = z.infer<typeof InventoryMovementResponseSchema>;
export type InventoryMovementListResponse = z.infer<typeof InventoryMovementListResponseSchema>;
export type FIFOBatchInfo = z.infer<typeof FIFOBatchInfoSchema>;
export type ProductFIFOBatchesResponse = z.infer<typeof ProductFIFOBatchesResponseSchema>;
