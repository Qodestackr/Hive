import { z } from "zod";
import { ID, Timestamps } from "../shared/base.schema.js";
import { Money } from "../shared/money.schema.js";

export const PromotionSchema = z
	.object({
		id: ID,
		name: z.string(),
		description: z.string().optional(),
		discount: Money.or(z.number().positive()), // configurable: flat vs % later
		active: z.boolean().default(true),
		startsAt: z.string().datetime(),
		endsAt: z.string().datetime(),
	})
	.merge(Timestamps);
