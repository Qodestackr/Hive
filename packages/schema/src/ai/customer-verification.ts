import { z } from "zod";

/**
 * Schema for customer verification tool input
 * Used to verify customer eligibility for alcohol promotions
 */
export const CustomerVerificationSchema = z.object({
    customerId: z.string().describe("Customer ID or phone number"),
    customerType: z
        .enum(["B2C", "B2B"])
        .optional().describe("Customer type (auto-detected if not provided)"),
});

export type CustomerVerificationInput = z.infer<
    typeof CustomerVerificationSchema
>;
