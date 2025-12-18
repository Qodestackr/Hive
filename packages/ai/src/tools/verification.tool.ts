import { Effect } from "effect";
import { z } from "zod";
import { createError, OrganizationContext } from "@repo/utils";

function calculateAge(dateOfBirth: Date | null | undefined): number | null {
    if (!dateOfBirth) return null;
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
        age--;
    }
    return age;
}

export const CustomerSegmentSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    customerType: z.enum(["B2C", "B2B"]),
    filters: z.object({
        // B2C filters
        ageVerified: z.boolean().optional(),
        minAge: z.number().optional(),
        orderFrequency: z.enum(["weekly", "monthly", "quarterly"]).optional(),
        // Behavioral patterns
        ordersAtSimilarTimes: z.boolean().optional(), // "Order most similar times of month"
        averageOrderValue: z.object({ min: z.number(), max: z.number() }).optional(),

        // B2B filters
        hasValidLicense: z.boolean().optional(),
        licenseType: z.enum(["bar", "restaurant", "retail", "distributor"]).optional(),
    }),
});

export type CustomerSegment = z.infer<typeof CustomerSegmentSchema>;

export const VerificationResultSchema = z.object({
    customerId: z.string(),
    customerType: z.enum(["B2C", "B2B"]),
    verified: z.boolean(),
    reason: z.string().optional(),
    metadata: z.object({
        age: z.number().optional(),
        licenseNumber: z.string().optional(),
        licenseExpiry: z.date().optional(),
    }),
});

export type VerificationResult = z.infer<typeof VerificationResultSchema>;

export class VerificationService {
    /**
     * Verify a customer (B2C or B2B)
     * 
     * B2C: Check age verification status
     * B2B: Check license validity
     */
    static verifyCustomerEffect(customerId: string) {
        return Effect.gen(function* () {
            // For now, assume B2C (age verification)
            // TODO: Query customer type from DB
            const customerType = "B2C";

            if (customerType === "B2C") {
                return yield* VerificationService.verifyAgeEffect(customerId);
            } else {
                return yield* VerificationService.verifyLicenseEffect(customerId);
            }
        });
    }

    /**
     * B2C: Age Verification
     * 
     * Check if customer has verified age (18+)
     * In Kenya, liquor sales require age verification
     */
    static verifyAgeEffect(customerId: string) {
        return Effect.gen(function* () {
            const { organizationId } = yield* OrganizationContext;

            // Query customer from DB
            const db = yield* Effect.promise(() => import("@repo/db"));
            const { customers } = db.schema;
            const { eq, and } = db.operators;

            const customer = yield* Effect.tryPromise({
                try: async () => {
                    const result = await db.query.customers.findFirst({
                        where: and(
                            eq(customers.id, customerId),
                            eq(customers.organizationId, organizationId)
                        ),
                    });
                    return result;
                },
                catch: (error) =>
                    createError.notFound("Customer not found", {
                        customerId,
                        error,
                    }),
            });

            if (!customer) {
                return yield* Effect.fail(
                    createError.notFound("Customer not found", { customerId })
                );
            }

            // Check if age verified (customers table has isAgeVerified flag)
            if (!customer.isAgeVerified) {
                return {
                    customerId,
                    customerType: "B2C" as const,
                    verified: false,
                    reason: "Age verification required. Customer must verify they are 18+.",
                    metadata: { age: null },
                };
            }

            // Calculate age from DOB
            const age = calculateAge(customer.dateOfBirth);

            return {
                customerId,
                customerType: "B2C" as const,
                verified: true,
                metadata: { age },
            };
        });
    }

    static verifyLicenseEffect(customerId: string) {
        return Effect.gen(function* () {
            // TODO: Query license table (we'll add this later per user request)
            // For now, mock
            const hasValidLicense = true;
            const licenseNumber = "LIC-123456";
            const licenseExpiry = new Date("2025-12-31");

            const isExpired = licenseExpiry < new Date();

            if (!hasValidLicense || isExpired) {
                return {
                    customerId,
                    customerType: "B2B" as const,
                    verified: false,
                    reason: isExpired
                        ? "License expired. Renew license to continue ordering."
                        : "No valid license found. Business must have alcohol distribution license.",
                    metadata: { licenseNumber, licenseExpiry },
                };
            }

            return {
                customerId,
                customerType: "B2B" as const,
                verified: true,
                metadata: { licenseNumber, licenseExpiry },
            };
        });
    }
}

export class SegmentationEngine {
    /**
     * Check if customer matches segment criteria
     * 
     * Example segments:
     * - "B2C - Verified, Orders Monthly, High AOV"
     * - "B2B - Licensed Bars in Nairobi"
     * - "Behavioral - Orders 1st week of month"
     */
    static matchesSegmentEffect(customerId: string, segment: CustomerSegment) {
        return Effect.gen(function* () {
            // TODO: Load customer data
            // const customer = yield* customerService.getByIdEffect(customerId);
            // const orders = yield* orderService.getCustomerOrdersEffect(customerId);

            // Mock customer data
            const customer = {
                id: customerId,
                type: "B2C" as const,
                ageVerified: false,
                age: null,
            };

            const orders = [
                // Mock orders - would come from DB
                { createdAt: new Date("2024-11-05"), total: 5000 },
                { createdAt: new Date("2024-12-03"), total: 6000 },
            ];

            // Check type match
            if (customer.type !== segment.customerType) {
                return { matches: false, reason: "Customer type mismatch" };
            }

            // B2C filters
            if (segment.customerType === "B2C") {
                // Age verification
                if (segment.filters.ageVerified && !customer.ageVerified) {
                    return { matches: false, reason: "Age not verified" };
                }

                if (segment.filters.minAge && (!customer.age || customer.age < segment.filters.minAge)) {
                    return { matches: false, reason: "Does not meet minimum age" };
                }

                // Order timing pattern
                if (segment.filters.ordersAtSimilarTimes) {
                    const orderDates = orders.map((o) => o.createdAt.getDate());
                    const hasPattern = SegmentationEngine.detectOrderingPattern(orderDates);

                    if (!hasPattern) {
                        return { matches: false, reason: "No consistent ordering pattern" };
                    }
                }

                // Average order value
                if (segment.filters.averageOrderValue) {
                    const avgOrderValue =
                        orders.reduce((sum, o) => sum + o.total, 0) / orders.length;

                    if (
                        avgOrderValue < segment.filters.averageOrderValue.min ||
                        avgOrderValue > segment.filters.averageOrderValue.max
                    ) {
                        return { matches: false, reason: "Average order value out of range" };
                    }
                }
            }

            // B2B filters
            if (segment.customerType === "B2B") {
                // License validation
                if (segment.filters.hasValidLicense) {
                    const verification = yield* VerificationService.verifyLicenseEffect(customerId);
                    if (!verification.verified) {
                        return { matches: false, reason: verification.reason };
                    }
                }
            }

            return { matches: true };
        });
    }

    /**
     * Detect if customer orders at similar times each month
     * 
     * E.g., always orders 1st week of month (payday!)
     */
    static detectOrderingPattern(orderDates: number[]): boolean {
        if (orderDates.length < 2) return false;

        // Check if most orders cluster around same day of month
        const variance =
            orderDates.reduce((sum, date) => sum + Math.pow(date - orderDates[0], 2), 0) /
            orderDates.length;

        // Low variance = consistent pattern
        return variance < 25; // Within ~5 days
    }

    /**
     * Get eligible customers for a campaign
     * 
     * Returns list of customer IDs who match the segment
     */
    static getEligibleCustomersEffect(segment: CustomerSegment) {
        return Effect.gen(function* () {
            const { organizationId } = yield* OrganizationContext;

            // TODO: Query all customers, filter by segment
            // For now, return empty
            return [];
        });
    }
}

/**
 * Generate deterministic messages (100% consistent)
 * 
 * NO AI randomness - same input = same output
 * AI can reference these messages in conversation history
 */
export class DeterministicMessageGenerator {
    private static TEMPLATES = {
        // Opt-in messages
        LOYALTY_OPTIN: () => "You have been opted into our loyalty perks",
        PROMO_OPTIN: (promoName: string) =>
            `You are now registered for ${promoName}. You'll receive exclusive deals.`,

        // Verification prompts
        AGE_VERIFICATION_REQUIRED: () =>
            "To continue, please verify you are 18+. Reply with your ID number or date of birth.",
        LICENSE_VERIFICATION_REQUIRED: () =>
            "Your business license has expired. Please renew to continue ordering.",

        // Promo notifications
        PROMO_AVAILABLE: (promoCode: string, discount: number) =>
            `New offer! Use code ${promoCode} for ${discount}% off your next order.`,
        PROMO_EXPIRING: (promoCode: string, daysLeft: number) =>
            `Reminder: Code ${promoCode} expires in ${daysLeft} days. Use it now!`,

        // Order confirmations
        ORDER_CONFIRMED: (orderId: string, total: number) =>
            `Order ${orderId} confirmed. Total: KES ${total.toLocaleString()}. We'll deliver soon!`,
        ORDER_DELIVERED: (orderId: string) => `Order ${orderId} has been delivered. Enjoy!`,
    } as const;


    static generate(
        messageType: keyof typeof DeterministicMessageGenerator.TEMPLATES,
        ...params: any[]
    ): string {
        const template = DeterministicMessageGenerator.TEMPLATES[messageType];
        // @ts-ignore - params are type-safe per template
        return template(...params);
    }

    /**
     * Store message in conversation history
     * 
     * AI can reference this later if user asks follow-up questions
     */
    static storeMessage(
        customerId: string,
        messageType: string,
        message: string
    ): Effect.Effect<void, never, OrganizationContext> {
        return Effect.gen(function* () {
            // TODO: Store in conversation_history table
            // {
            //   customerId,
            //   messageType,
            //   message,
            //   timestamp: new Date(),
            //   sender: 'system'
            // }

            console.log(
                `[DeterministicMessage] ${messageType} sent to ${customerId}: "${message}"`
            );
        });
    }
}
