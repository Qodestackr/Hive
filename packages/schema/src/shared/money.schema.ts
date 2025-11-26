import { z } from "zod";

export const Money = z.object({
	amount: z.number().nonnegative(),
	currency: z.string().min(3).max(3),
});
