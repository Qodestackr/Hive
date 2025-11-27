import { tool } from "ai";
import { z } from "zod";
import { VerificationService } from "./verification.tool";
import { Effect } from "effect";
import { OrganizationContext } from "@repo/utils";

/**
 * AI Tool: Customer Verification
 * 
 * Checks if customer can receive promo (age/license verification)
 * Agent calls this BEFORE sending any promo offers
 */
export const customerVerificationTool = tool({
    description: [
        "Verify if a customer is eligible to receive alcohol promo offers.",
        "For B2C: Checks age verification (18+).",
        "For B2B: Checks valid business license.",
        "Always call this before sending promo codes.",
    ].join(" "),

    parameters: z.object({
        customerId: z.string().describe("Customer ID or phone number"),
        customerType: z.enum(["B2C", "B2B"]).optional().describe("Customer type (auto-detected if not provided)"),
    }),

    execute: async ({ customerId, customerType }) => {
        const program = VerificationService.verifyCustomerEffect(customerId).pipe(
            // For now, provide a dummy context - will be replaced with actual context in agent
            Effect.provideService(OrganizationContext, { organizationId: "test" })
        );

        const result = await Effect.runPromise(program);

        return {
            verified: result.verified,
            canReceivePromo: result.verified,
            reason: result.reason,
            action: result.verified
                ? "OK to send promo"
                : result.customerType === "B2C"
                    ? "Request age verification first"
                    : "Request license renewal",
            metadata: result.metadata,
        };
    },
});
