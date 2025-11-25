import { z } from "zod";
import { ID, Timestamps } from "../shared/base.schema";
import { Money } from "../shared/money.schema";

export const BillingPlanSchema = z.object({
  id: ID,
  name: z.string(),
  price: Money,
  interval: z.enum(["day", "month", "year"]),
}).merge(Timestamps);
