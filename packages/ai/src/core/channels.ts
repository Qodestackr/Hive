/**
 * Channel Abstraction Layer
 * 
 * The "Trigger from Anywhere" pattern (12 Factor #11)
 * 
 * This enables:
 * - Test with internal chat during development
 * - Swap to WhatsApp/SMS/Slack in production with ZERO agent code changes
 * - Add new channels without touching business logic
 */

import { z } from "zod";

// ============================================================================
// CHANNEL-AGNOSTIC MESSAGE SCHEMA
// ============================================================================

/**
 * Unified message format that works across all channels
 */
export const IncomingMessageSchema = z.object({
    /** Unique message ID (for idempotency) */
    id: z.string(),

    /** Channel this came from */
    channel: z.enum(["internal_chat", "whatsapp", "sms", "telegram", "slack"]),

    /** Who sent it */
    from: z.object({
        /** User identifier (phone number, user ID, etc.) */
        id: z.string(),
        /** Display name (optional) */
        name: z.string().nullable().optional(),
    }),

    /** Message content */
    content: z.object({
        /** The actual message text */
        text: z.string(),
        /** Attachments (for future: images, PDFs) */
        attachments: z.array(z.string()).optional(),
    }),

    /** Metadata */
    metadata: z.object({
        /** Original channel-specific payload (for debugging) */
        raw: z.unknown().optional(),
        /** Timestamp */
        timestamp: z.date().default(() => new Date()),
        /** Organization context */
        organizationId: z.string().optional(),
    }),
});

export type IncomingMessage = z.infer<typeof IncomingMessageSchema>;

/**
 * Outgoing message (response)
 */
export const OutgoingMessageSchema = z.object({
    /** Recipient */
    to: z.object({
        id: z.string(),
        channel: z.enum(["internal_chat", "whatsapp", "sms", "telegram", "slack"]),
    }),

    /** Message content */
    content: z.object({
        text: z.string(),
        /** Formatting hints (markdown, buttons, etc.) */
        format: z.enum(["plain", "markdown", "rich"]).default("plain"),
        /** Quick reply buttons (channel will render appropriately) */
        quickReplies: z.array(z.string()).optional(),
    }),

    /** Metadata */
    metadata: z.object({
        /** Reply to specific message (for threading) */
        replyToId: z.string().optional(),
        /** Tags for analytics */
        tags: z.array(z.string()).optional(),
    }),
});

export type OutgoingMessage = z.infer<typeof OutgoingMessageSchema>;

// ============================================================================
// CHANNEL ADAPTER INTERFACE
// ============================================================================

/**
 * All channel adapters implement this interface
 */
export interface IChannelAdapter {
    /** Channel name */
    readonly name: string;

    /** Convert channel-specific payload → IncomingMessage */
    parse(rawPayload: unknown): Promise<IncomingMessage>;

    /** Send OutgoingMessage → channel-specific format */
    send(message: OutgoingMessage): Promise<{ success: boolean; messageId?: string }>;
}

// ============================================================================
// INTERNAL CHAT ADAPTER (for testing!)
// ============================================================================

/**
 * In-app chat adapter for fast iteration
 * 
 * Usage:
 * - POST /api/chat/send { userId, text, organizationId }
 * - Agent processes
 * - Response goes to DB → UI polls or uses WebSocket
 */
export class InternalChatAdapter implements IChannelAdapter {
    readonly name = "internal_chat";

    async parse(rawPayload: unknown): Promise<IncomingMessage> {
        // Simple schema for internal testing
        const payload = z
            .object({
                userId: z.string(),
                text: z.string(),
                organizationId: z.string(),
                messageId: z.string().optional(),
            })
            .parse(rawPayload);

        return {
            id: payload.messageId ?? `internal_${Date.now()}`,
            channel: "internal_chat",
            from: {
                id: payload.userId,
                name: null,
            },
            content: {
                text: payload.text,
            },
            metadata: {
                raw: rawPayload,
                timestamp: new Date(),
                organizationId: payload.organizationId,
            },
        };
    }

    async send(message: OutgoingMessage): Promise<{ success: boolean; messageId?: string }> {
        // In production, this would:
        // 1. Store in `chat_messages` table
        // 2. Trigger WebSocket event or push notification
        // 3. Return message ID

        console.log("📨 [InternalChat] Sending:", message.content.text);

        // For now, just log (we'll add DB storage next)
        return {
            success: true,
            messageId: `msg_${Date.now()}`,
        };
    }
}

// ============================================================================
// WHATSAPP ADAPTER (stub - swap in when ready!)
// ============================================================================

/**
 * WhatsApp adapter (Twilio or WhatsApp Business API)
 * 
 * When ready to go live:
 * 1. Add Twilio credentials
 * 2. Swap `InternalChatAdapter` → `WhatsAppAdapter` in router
 * 3. Zero agent code changes!
 */
export class WhatsAppAdapter implements IChannelAdapter {
    readonly name = "whatsapp";

    constructor(
        private config: {
            accountSid?: string;
            authToken?: string;
            fromNumber?: string;
        }
    ) { }

    async parse(rawPayload: unknown): Promise<IncomingMessage> {
        // Parse Twilio webhook payload
        const payload = z
            .object({
                From: z.string(), // +254700123456
                Body: z.string(),
                MessageSid: z.string(),
            })
            .parse(rawPayload);

        return {
            id: payload.MessageSid,
            channel: "whatsapp",
            from: {
                id: payload.From,
                name: null,
            },
            content: {
                text: payload.Body,
            },
            metadata: {
                raw: rawPayload,
                timestamp: new Date(),
            },
        };
    }

    async send(message: OutgoingMessage): Promise<{ success: boolean; messageId?: string }> {
        // TODO: Call Twilio API
        // const client = twilio(this.config.accountSid, this.config.authToken);
        // await client.messages.create({
        //   from: `whatsapp:${this.config.fromNumber}`,
        //   to: `whatsapp:${message.to.id}`,
        //   body: message.content.text
        // });

        console.log("📱 [WhatsApp] Would send:", message.content.text);

        return {
            success: true,
            messageId: `whatsapp_${Date.now()}`,
        };
    }
}

// ============================================================================
// CHANNEL ROUTER (Smart Dispatcher)
// ============================================================================

/**
 * Routes messages to the correct adapter
 * 
 * This is the ONLY place you change when swapping channels!
 */
export class ChannelRouter {
    private adapters = new Map<string, IChannelAdapter>();

    constructor() {
        // Register adapters
        this.register(new InternalChatAdapter());
        this.register(new WhatsAppAdapter({})); // Stub for now
    }

    register(adapter: IChannelAdapter) {
        this.adapters.set(adapter.name, adapter);
    }

    getAdapter(channel: string): IChannelAdapter {
        const adapter = this.adapters.get(channel);
        if (!adapter) {
            throw new Error(`No adapter registered for channel: ${channel}`);
        }
        return adapter;
    }

    /**
     * Parse incoming message from any channel
     */
    async parseIncoming(channel: string, rawPayload: unknown): Promise<IncomingMessage> {
        const adapter = this.getAdapter(channel);
        return adapter.parse(rawPayload);
    }

    /**
     * Send outgoing message via any channel
     */
    async sendOutgoing(message: OutgoingMessage): Promise<{ success: boolean; messageId?: string }> {
        const adapter = this.getAdapter(message.to.channel);
        return adapter.send(message);
    }
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * In your API route:
 * 
 * ```typescript
 * // POST /api/chat/message (internal chat for testing)
 * const router = new ChannelRouter();
 * 
 * const incomingMessage = await router.parseIncoming('internal_chat', {
 *   userId: 'user_123',
 *   text: 'Nina code TUSKER50',
 *   organizationId: 'org_456'
 * });
 * 
 * // Process with agent...
 * const response = await promoRedemptionAgent.process(incomingMessage);
 * 
 * // Send response
 * await router.sendOutgoing({
 *   to: { id: incomingMessage.from.id, channel: 'internal_chat' },
 *   content: { text: response.message }
 * });
 * ```
 * 
 * When ready for WhatsApp:
 * - Change 'internal_chat' → 'whatsapp'
 * - Add Twilio credentials
 * - Done!
 */
