import { tool } from "ai";

import { ProfitCalculator } from "@repo/services";
import { ProfitCalculatorSchema } from "@repo/schema/ai";
import z from "zod";

type ProfitResult =
    | {
        ok: true; data: {
            profit: number;
            totalRevenue: number;
            totalCost: number;
            isProfitable: boolean;
            marginPercent: number;
        }
    }
    | { ok: false; error: string };

export const profitCalculatorTool = tool({
    description: "Calculate profit for a discount. Returns profit, revenue, cost, and margin %.",
    parameters: z.object({
        basePrice: z.number().describe("The original selling price of the product"),
        quantity: z.number().default(1).describe("Number of units"),
        discountType: z.enum(["percentage", "fixed"]).describe("Type of discount"),
        discountValue: z.number().describe("Value of the discount (e.g., 20 for 20%)"),
        unitCost: z.number().describe("The FIFO unit cost of the product"),
    }),

    execute: async (args): Promise<ProfitResult> => {
        try {
            const result = ProfitCalculator.calculate({
                basePrice: args.basePrice,
                quantity: args.quantity,
                discountType: args.discountType,
                discountValue: args.discountValue,
                unitCost: args.unitCost,
            });

            const discountAmount = args.discountType === "percentage"
                ? (args.basePrice * args.discountValue) / 100
                : args.discountValue;

            const finalPrice = args.basePrice - discountAmount;
            const marginPercent = ((finalPrice - args.unitCost) / finalPrice) * 100;

            return {
                ok: true,
                data: {
                    profit: result.actualProfit,
                    totalRevenue: result.netRevenue,
                    totalCost: result.totalCOGS,
                    isProfitable: result.isProfitable,
                    marginPercent: Math.round(marginPercent * 100) / 100,
                },
            };
        } catch (error) {
            return {
                ok: false,
                error: String(error),
            };
        }
    },
});