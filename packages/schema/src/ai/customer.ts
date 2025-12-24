import { z } from "zod";

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
}).openapi("CustomerSegment");

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
}).openapi("VerificationResult");

export type CustomerSegment = z.infer<typeof CustomerSegmentSchema>;
export type VerificationResult = z.infer<typeof VerificationResultSchema>;
