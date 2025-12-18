import { IncomingMessage, OutgoingMessage } from "@repo/schema";
import { z } from "@repo/schema";

// All channel adapters implement this interface
export interface IChannelAdapter {
    /** Channel name */
    readonly name: string;

    /** Convert channel-specific payload → IncomingMessage */
    parse(rawPayload: unknown): Promise<IncomingMessage>;

    /** Send OutgoingMessage → channel-specific format */
    send(message: OutgoingMessage): Promise<{ success: boolean; messageId?: string }>;
}

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

    async parseIncoming(channel: string, rawPayload: unknown): Promise<IncomingMessage> {
        const adapter = this.getAdapter(channel);
        return adapter.parse(rawPayload);
    }

    async sendOutgoing(message: OutgoingMessage): Promise<{ success: boolean; messageId?: string }> {
        const adapter = this.getAdapter(message.to.channel);
        return adapter.send(message);
    }
}