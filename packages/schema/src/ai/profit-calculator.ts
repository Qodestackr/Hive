import { z } from "zod";

export const ProfitCalculatorSchema = z
    .object({
        basePrice: z.number().positive(),
        quantity: z.number().int().positive().default(1),
        discountType: z.enum(["percentage", "fixed"]),
        discountValue: z.number().nonnegative(),
        unitCost: z.number().nonnegative(),
    })
    .refine(
        (data) => data.discountType !== "percentage" || data.discountValue <= 100,
        "Percentage discount cannot exceed 100%",
    )
    .refine(
        (data) =>
            data.discountType !== "fixed" || data.discountValue <= data.basePrice,
        "Fixed discount cannot exceed base price",
    );

export type ProfitCalculatorInput = z.infer<typeof ProfitCalculatorSchema>;
