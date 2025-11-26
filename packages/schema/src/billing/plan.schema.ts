import { z } from "zod";
import { ID, Timestamps } from "../shared/base.schema.js";
import { Money } from "../shared/money.schema.js";

export const BillingPlanSchema = z
	.object({
		id: ID,
		name: z.string(),
		price: Money,
		interval: z.enum(["day", "month", "year"]),
	})
	.merge(Timestamps);
