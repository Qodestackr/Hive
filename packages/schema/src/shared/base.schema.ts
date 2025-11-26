import { z } from "zod";

// ============================================================================
// BASE SCHEMAS (Reusable building blocks)
// ============================================================================

/**
 * ID schema
 */
export const ID = z
	.object({
		id: z.string(),
	})
	.openapi("ID");

/**
 * Timestamps schema
 */
export const Timestamps = z
	.object({
		createdAt: z.string().datetime(),
		updatedAt: z.string().datetime(),
	})
	.openapi("Timestamps");

// ============================================================================
// COMMON RESPONSE SCHEMAS
// ============================================================================

/**
 * Success response (for DELETE operations)
 */
export const SuccessResponseSchema = z
	.object({
		success: z.boolean(),
	})
	.openapi("SuccessResponse");

/**
 * Bulk update response
 */
export const BulkUpdateResponseSchema = z
	.object({
		updated: z.number().int().nonnegative(),
	})
	.openapi("BulkUpdateResponse");

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type BulkUpdateResponse = z.infer<typeof BulkUpdateResponseSchema>;
