import { z } from "zod";
import { ID, Timestamps } from "../shared/base.schema.js";
import { Money } from "../shared/money.schema.js";

export const PromotionSchema = z
	.object({
		id: ID,
		organizationId: ID,
		name: z.string().openapi({
			example: "Holiday Season Sale",
		}),
		description: z.string().optional().openapi({
			example: "20% off all premium spirits",
		}),
		discount: Money.or(z.number().positive()).openapi({
			description: "Discount as money object or percentage",
			example: 20,
		}),
		active: z.boolean().default(true),
		startsAt: z.string().datetime(),
		endsAt: z.string().datetime(),
	})
	.merge(Timestamps)
	.openapi("Promotion");

export const PromotionCreateSchema = z
	.object({
		name: z.string().min(1, "Promotion name is required").openapi({
			example: "Holiday Season Sale",
		}),
		description: z.string().optional(),
		discount: Money.or(z.number().positive().max(100, "Percentage must be between 0-100")),
		active: z.boolean().default(true),
		startsAt: z.string().datetime(),
		endsAt: z.string().datetime(),
	})
	.refine((data) => new Date(data.endsAt) > new Date(data.startsAt), {
		message: "End date must be after start date",
		path: ["endsAt"],
	})
	.openapi("PromotionCreate");

export const PromotionUpdateSchema = PromotionCreateSchema.partial()
	.refine(
		(data) => {
			if (data.startsAt && data.endsAt) {
				return new Date(data.endsAt) > new Date(data.startsAt);
			}
			return true;
		},
		{
			message: "End date must be after start date",
			path: ["endsAt"],
		},
	)
	.openapi("PromotionUpdate");

export const PromotionListQuerySchema = z
	.object({
		page: z.coerce.number().int().positive().default(1),
		limit: z.coerce.number().int().positive().max(100).default(20),
		active: z.coerce.boolean().optional(),
		search: z.string().optional().openapi({
			description: "Search by name or description",
		}),
		sortBy: z.enum(["name", "startsAt", "endsAt", "createdAt"]).default("createdAt"),
		sortOrder: z.enum(["asc", "desc"]).default("desc"),
	})
	.openapi("PromotionListQuery");

export const PromotionResponseSchema = PromotionSchema.openapi("PromotionResponse");

export const PromotionListResponseSchema = z
	.object({
		data: z.array(PromotionResponseSchema),
		pagination: z.object({
			page: z.number(),
			limit: z.number(),
			total: z.number(),
			totalPages: z.number(),
		}),
	})
	.openapi("PromotionListResponse");

export type Promotion = z.infer<typeof PromotionSchema>;
export type PromotionCreate = z.infer<typeof PromotionCreateSchema>;
export type PromotionUpdate = z.infer<typeof PromotionUpdateSchema>;
export type PromotionListQuery = z.infer<typeof PromotionListQuerySchema>;
export type PromotionResponse = z.infer<typeof PromotionResponseSchema>;
export type PromotionListResponse = z.infer<typeof PromotionListResponseSchema>;
