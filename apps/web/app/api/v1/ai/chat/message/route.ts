import { z } from "@repo/schema";
import { Effect } from "effect";
import { OrganizationContext } from "@repo/utils";
import { ChannelRouter, PromoRedemptionAgent } from "@repo/ai";
import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";

/**
 * AI Chat API - Internal testing interface
 * 
 * POST /api/v1/ai/chat/message
 * { "text": "Nina code TUSKER50", "userId": "user_123" }
 */

const SendMessageSchema = z.object({
    text: z.string().min(1).max(500),
    userId: z.string().optional().default("test_user"),
});

const SendMessageResponseSchema = z.object({
    success: z.boolean(),
    reply: z.string(),
    metadata: z
        .object({
            code: z.string().optional(),
            orderId: z.string().optional(),
        })
        .optional(),
});

export const POST = createWorkspaceRouteEffect({
    inputSchema: SendMessageSchema,
    outputSchema: SendMessageResponseSchema,

    handler: (data) =>
        Effect.gen(function* () {
            // Initialize channel router
            const router = new ChannelRouter();

            // Parse incoming message (with organization context from Effect)
            const { organizationId } = yield* OrganizationContext;

            const incomingMessage = yield* Effect.promise(() =>
                router.parseIncoming("internal_chat", {
                    userId: data.userId,
                    text: data.text,
                    organizationId,
                })
            );

            // Process with PromoRedemptionAgent
            const result = yield* PromoRedemptionAgent.processEffect(incomingMessage);

            // Send reply
            if (result.reply) {
                yield* Effect.promise(() => router.sendOutgoing(result.reply));
            }

            return {
                success: result.success,
                reply: result.message,
                metadata: {
                    code: result.code,
                    orderId: result.orderId,
                },
            };
        }),

    options: {
        operationName: "sendChatMessage",
        requiredPermissions: [], // Public for testing
        errorContext: {
            feature: "conversational-commerce",
            action: "send-chat-message",
        },
    },
});
