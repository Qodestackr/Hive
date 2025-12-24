import { z } from "zod";

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
