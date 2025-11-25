import { z } from "zod";
import { ID, Timestamps } from "../shared/base.schema.js";

// ============================================================================
// RECONCILIATION SCHEMAS (Trust Engine)
// ============================================================================

/**
 * Reconcile single product request
 */
export const ReconcileProductSchema = z.object({
    productId: ID.openapi({ example: 'prod_123' }),
    actualPhysicalCount: z.number().int().nonnegative().optional().openapi({
        description: 'Optional manual physical count override',
        example: 50
    }),
}).openapi('ReconcileProduct');

/**
 * Reconcile all products request (no input needed - uses workspace context)
 */
export const ReconcileAllProductsSchema = z.object({}).openapi('ReconcileAllProducts');

/**
 * Correct inventory discrepancy request
 */
export const CorrectDiscrepancySchema = z.object({
    reconciliationLogId: ID.openapi({ example: 'recon_123' }),
    correctionQty: z.number().int().openapi({
        description: 'Correction quantity (positive or negative)',
        example: -5
    }),
    reason: z.string().min(5, 'Reason must be at least 5 characters').openapi({
        description: 'Explanation for the correction',
        example: 'Physical count revealed 5 units were damaged and disposed'
    }),
}).openapi('CorrectDiscrepancy');

/**
 * Reconciliation result (single product)
 */
export const ReconciliationResultSchema = z.object({
    isInSync: z.boolean().openapi({
        description: 'True if ledger matches actual stock (within 1-unit tolerance)',
        example: false
    }),
    expectedQuantity: z.number().int().openapi({
        description: 'Expected quantity from inventory_movements ledger',
        example: 100
    }),
    recordedQuantity: z.number().int().openapi({
        description: 'Recorded quantity in product.currentStockQuantity',
        example: 95
    }),
    actualQuantity: z.number().int().openapi({
        description: 'Actual quantity (manual count or recorded)',
        example: 95
    }),
    discrepancy: z.number().int().openapi({
        description: 'Difference (expected - actual)',
        example: 5
    }),
    reconciliationLogId: z.string().optional().openapi({
        description: 'Log ID if discrepancy was created',
        example: 'recon_123'
    }),
    requiresAction: z.boolean().optional().openapi({
        description: 'True if manual correction needed',
        example: true
    }),
}).openapi('ReconciliationResult');

/**
 * Reconciliation summary (all products)
 */
export const ReconciliationSummarySchema = z.object({
    totalProducts: z.number().int().nonnegative().openapi({
        description: 'Total number of products reconciled',
        example: 50
    }),
    inSync: z.number().int().nonnegative().openapi({
        description: 'Number of products in sync',
        example: 47
    }),
    outOfSync: z.number().int().nonnegative().openapi({
        description: 'Number of products with discrepancies',
        example: 3
    }),
    discrepancies: z.array(z.object({
        productId: ID,
        discrepancy: z.number().int(),
    })).openapi({
        description: 'List of products with discrepancies',
        example: [
            { productId: 'prod_123', discrepancy: 5 },
            { productId: 'prod_456', discrepancy: -3 },
        ]
    }),
}).openapi('ReconciliationSummary');

/**
 * Correction success response
 */
export const CorrectionSuccessSchema = z.object({
    success: z.literal(true),
    message: z.string(),
    reconciliationLogId: ID,
}).openapi('CorrectionSuccess');

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ReconcileProduct = z.infer<typeof ReconcileProductSchema>;
export type ReconcileAllProducts = z.infer<typeof ReconcileAllProductsSchema>;
export type CorrectDiscrepancy = z.infer<typeof CorrectDiscrepancySchema>;
export type ReconciliationResult = z.infer<typeof ReconciliationResultSchema>;
export type ReconciliationSummary = z.infer<typeof ReconciliationSummarySchema>;
export type CorrectionSuccess = z.infer<typeof CorrectionSuccessSchema>;
