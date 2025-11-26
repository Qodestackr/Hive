import { z } from "zod";
import { ID, Timestamps } from "../shared/base.schema";
import { SubscriptionStatus } from "../shared/enums.schema";

export const SubscriptionSchema = z
	.object({
		id: ID,
		userId: ID,
		planId: ID,
		status: SubscriptionStatus,
		trialEndsAt: z.string().datetime().optional(),
		cancelAtPeriodEnd: z.boolean().optional(),
	})
	.merge(Timestamps);
