import { tool } from "ai";
import { z } from "zod";
import { ProfitCalculator } from "@repo/services";

export const profitCalculatorTool = tool({
    description: "Calculate profit and break-even analysis for a potential promo. Use this to check if a discount is safe.",
    parameters: z.object({
        basePrice: z.number().describe("The original selling price of the product"),
        quantity: z.number().default(1).describe("Number of units"),
        discountType: z.enum(["percentage", "fixed"]).describe("Type of discount"),
        discountValue: z.number().describe("Value of the discount (e.g., 20 for 20%)"),
        unitCost: z.number().describe("The FIFO unit cost of the product"),
    }),
    execute: async (args) => {
        const result = ProfitCalculator.calculate({
            basePrice: args.basePrice,
            quantity: args.quantity,
            discountType: args.discountType,
            discountValue: args.discountValue,
            unitCost: args.unitCost,
        });

        return {
            ...result,
            recommendation: result.isProfitable
                ? "PROFITABLE: This promo makes money."
                : "LOSS_MAKER: Do not run this promo.",
        };
    },
});
