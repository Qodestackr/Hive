import "../zod-extend";
import { z } from "zod";

export const ID = z
	.object({
		id: z.string(),
	})
	.openapi("ID");

export const Timestamps = z
	.object({
		createdAt: z.string().datetime(),
		updatedAt: z.string().datetime(),
	})
	.openapi("Timestamps");

// Common response schema e.g for DELETE ops
export const SuccessResponseSchema = z
	.object({
		success: z.boolean(),
	})
	.openapi("SuccessResponse");

export const BulkUpdateResponseSchema = z
	.object({
		updated: z.number().int().nonnegative(),
	})
	.openapi("BulkUpdateResponse");

export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type BulkUpdateResponse = z.infer<typeof BulkUpdateResponseSchema>;
