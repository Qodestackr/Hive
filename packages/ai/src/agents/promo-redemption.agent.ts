import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { Effect } from "effect";
import { z } from "zod";
import { createError, OrganizationContext } from "@repo/utils";
import type { IncomingMessage, OutgoingMessage } from "../core/channels";
import { getPrompt } from "../core/prompts";
import { customerVerificationTool } from "../tools/customer-verification-ai.tool";
import { DeterministicMessageGenerator } from "../tools/verification.tool";

const ExtractionResultSchema = z.object({
    code: z.string().nullable(),
    phone: z.string().nullable(),
    confidence: z.number().min(0).max(1),
    reasoning: z.string().optional(),
});

const RedemptionStateSchema = z.object({
    step: z.enum([
        "extracting",
        "validating_code",
        "checking_compliance",
        "creating_order",
        "done",
    ]),
    extractedCode: z.string().nullable(),
    extractedPhone: z.string().nullable(),
    validationResult: z
        .object({
            valid: z.boolean(),
            discount: z.number().optional(),
            reason: z.string().optional(),
        })
        .nullable(),
    orderId: z.string().nullable(),
    error: z.string().nullable(),
});

export type RedemptionState = z.infer<typeof RedemptionStateSchema>;

// ============================================================================
// AGENT CLASS
// ============================================================================

export class PromoRedemptionAgent {
    /**
     * Process an incoming message (conversational promo redemption)
     */
    static processEffect(message: IncomingMessage) {
        return Effect.gen(function* () {
            const { organizationId } = yield* OrganizationContext;

            // Step 1: Extract code + phone from message
            const extracted = yield* PromoRedemptionAgent.extractCodeEffect(message.content.text);

            if (!extracted.code) {
                return {
                    success: false,
                    message:
                        "Sijapata promo code. Tuma code yako tena, mfano: 'Nina code TUSKER50'",
                    reply: {
                        to: { id: message.from.id, channel: message.channel },
                        content: {
                            text: "Sijapata promo code. Tuma code yako tena, mfano: 'Nina code TUSKER50'",
                            format: "plain" as const,
                        },
                        metadata: {},
                    } satisfies OutgoingMessage,
                };
            }

            // Step 2: Check if customer can receive promos (age/license verification)
            const verification = yield* Effect.tryPromise({
                try: () =>
                    customerVerificationTool.execute({
                        customerId: extracted.phone ?? message.from.id,
                        customerType: "B2C", // TODO: Determine from customer DB
                    }),
                catch: (error) => createError.internal("Verification check failed", { error }),
            });

            if (!verification.canReceivePromo) {
                // Use deterministic message
                const verificationMessage = DeterministicMessageGenerator.generate(
                    verification.reason?.includes("age")
                        ? "AGE_VERIFICATION_REQUIRED"
                        : "LICENSE_VERIFICATION_REQUIRED"
                );

                return {
                    success: false,
                    message: verificationMessage,
                    reply: {
                        to: { id: message.from.id, channel: message.channel },
                        content: {
                            text: verificationMessage,
                            format: "plain" as const,
                        },
                        metadata: { tags: ["verification_required"] },
                    } satisfies OutgoingMessage,
                };
            }

            // Step 3: Validate promo code (deterministic - database check)
            // TODO: Implement actual validation with promoCodeService
            const validation = {
                valid: true, // Mock for now
                discount: 20,
            };

            if (!validation.valid) {
                return {
                    success: false,
                    message: `Code ${extracted.code} si valid. Angalia ufanye sure iko correct.`,
                    reply: {
                        to: { id: message.from.id, channel: message.channel },
                        content: {
                            text: `Code ${extracted.code} si valid. Angalia ufanye sure iko correct.`,
                            format: "plain" as const,
                        },
                        metadata: {},
                    } satisfies OutgoingMessage,
                };
            }

            // Step 3: Check compliance (age verification)
            const phone = extracted.phone ?? message.from.id;
            // TODO: Implement age verification check
            const compliant = true; // Mock for now

            if (!compliant) {
                return {
                    success: false,
                    message: "Lazima u-verify umri wako kwanza. Tuma ID yako.",
                    reply: {
                        to: { id: message.from.id, channel: message.channel },
                        content: {
                            text: "Lazima u-verify umri wako kwanza. Tuma ID yako.",
                            format: "plain" as const,
                        },
                        metadata: {},
                    } satisfies OutgoingMessage,
                };
            }

            // Step 4: Create draft order
            // TODO: Integrate with actual order creation service
            const draftOrderId = `draft_${Date.now()}`;

            // Step 5: Success response
            return {
                success: true,
                code: extracted.code,
                phone,
                orderId: draftOrderId,
                message: `✅ Code ${extracted.code} iko valid! Discount yako ni ${validation.discount}%. Order yako iko pending approval. Tutakujibu hivi karibuni.`,
                reply: {
                    to: { id: message.from.id, channel: message.channel },
                    content: {
                        text: `✅ Code ${extracted.code} iko valid! Discount yako ni ${validation.discount}%. Order yako iko pending approval. Tutakujibu hivi karibuni.`,
                        format: "plain" as const,
                        quickReplies: ["Track order", "Redeem another code"],
                    },
                    metadata: {
                        tags: ["promo_redemption", "success"],
                    },
                } satisfies OutgoingMessage,
            };
        });
    }

    static extractCodeEffect(messageText: string) {
        return Effect.tryPromise({
            try: async () => {
                const systemPrompt = getPrompt({
                    prompt: "promoRedemption",
                    version: "v1",
                });

                const result = await generateObject({
                    model: anthropic("claude-3-5-haiku-20241022"),
                    schema: ExtractionResultSchema,
                    system: systemPrompt,
                    messages: [
                        {
                            role: "user",
                            content: [
                                {
                                    type: "text",
                                    text: `Extract promo code and phone from: "${messageText}"`,
                                },
                            ],
                        },
                    ],
                });

                return result.object;
            },
            catch: (error) =>
                createError.internal("Failed to extract promo code from message.", { error }),
        });
    }
}
