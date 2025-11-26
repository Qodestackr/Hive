import { z } from "zod";
import { ID, Timestamps } from "../shared/base.schema.js";

// WhatsApp Contact Schema
export const WhatsAppContactSchema = z
    .object({
        id: ID,
        organizationId: ID,
        customerId: z.string().nullable(),
        waId: z.string().openapi({
            description: "WhatsApp ID (phone number)",
            example: "254712345678",
        }),
        profileName: z.string().nullable(),
        lastMessageAt: z.string().datetime().nullable(),
        isBlocked: z.boolean().default(false),
    })
    .merge(Timestamps)
    .openapi("WhatsAppContact");

export const WhatsAppContactCreateSchema = z
    .object({
        waId: z.string().min(1, "WhatsApp ID is required").openapi({
            example: "254712345678",
        }),
        customerId: z.string().optional(),
        profileName: z.string().optional(),
    })
    .openapi("WhatsAppContactCreate");

export const WhatsAppContactUpdateSchema = z
    .object({
        customerId: z.string().optional(),
        profileName: z.string().optional(),
        isBlocked: z.boolean().optional(),
    })
    .openapi("WhatsAppContactUpdate");

// WhatsApp Message Schema
export const WhatsAppMessageSchema = z
    .object({
        id: ID,
        organizationId: ID,
        contactId: ID,
        campaignId: z.string().nullable(),
        waMessageId: z.string().nullable().openapi({
            description: "WhatsApp API message ID",
        }),
        direction: z.enum(["outbound", "inbound"]).openapi({
            example: "outbound",
        }),
        body: z.string().nullable(),
        mediaUrl: z.string().url().nullable(),
        status: z
            .enum(["pending", "sent", "delivered", "read", "failed"])
            .default("pending")
            .openapi({ example: "delivered" }),
        errorCode: z.string().nullable(),
        sentAt: z.string().datetime().nullable(),
        deliveredAt: z.string().datetime().nullable(),
        readAt: z.string().datetime().nullable(),
        createdAt: z.string().datetime(),
    })
    .openapi("WhatsAppMessage");

export const WhatsAppMessageSendSchema = z
    .object({
        contactId: z.string().min(1, "Contact ID is required"),
        body: z.string().min(1, "Message body is required").openapi({
            example: "Get 20% off Hennessy this weekend!",
        }),
        mediaUrl: z.string().url().optional(),
        campaignId: z.string().optional(),
    })
    .openapi("WhatsAppMessageSend");

export const WhatsAppMessageListQuerySchema = z
    .object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(20),
        contactId: z.string().optional(),
        campaignId: z.string().optional(),
        direction: z.enum(["outbound", "inbound"]).optional(),
        status: z.enum(["pending", "sent", "delivered", "read", "failed"]).optional(),
        sortBy: z.enum(["createdAt", "sentAt", "deliveredAt"]).default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
    })
    .openapi("WhatsAppMessageListQuery");

export const WhatsAppContactListQuerySchema = z
    .object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(20),
        customerId: z.string().optional(),
        isBlocked: z.coerce.boolean().optional(),
        search: z.string().optional().openapi({
            description: "Search by WhatsApp ID or profile name",
        }),
        sortBy: z.enum(["waId", "profileName", "lastMessageAt", "createdAt"]).default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
    })
    .openapi("WhatsAppContactListQuery");

export const WhatsAppContactResponseSchema =
    WhatsAppContactSchema.openapi("WhatsAppContactResponse");

export const WhatsAppMessageResponseSchema =
    WhatsAppMessageSchema.openapi("WhatsAppMessageResponse");

export const WhatsAppContactListResponseSchema = z
    .object({
        data: z.array(WhatsAppContactResponseSchema),
        pagination: z.object({
            page: z.number(),
            limit: z.number(),
            total: z.number(),
            totalPages: z.number(),
        }),
    })
    .openapi("WhatsAppContactListResponse");

export const WhatsAppMessageListResponseSchema = z
    .object({
        data: z.array(WhatsAppMessageResponseSchema),
        pagination: z.object({
            page: z.number(),
            limit: z.number(),
            total: z.number(),
            totalPages: z.number(),
        }),
    })
    .openapi("WhatsAppMessageListResponse");

export type WhatsAppContact = z.infer<typeof WhatsAppContactSchema>;
export type WhatsAppContactCreate = z.infer<typeof WhatsAppContactCreateSchema>;
export type WhatsAppContactUpdate = z.infer<typeof WhatsAppContactUpdateSchema>;
export type WhatsAppContactListQuery = z.infer<typeof WhatsAppContactListQuerySchema>;
export type WhatsAppContactResponse = z.infer<typeof WhatsAppContactResponseSchema>;
export type WhatsAppContactListResponse = z.infer<typeof WhatsAppContactListResponseSchema>;

export type WhatsAppMessage = z.infer<typeof WhatsAppMessageSchema>;
export type WhatsAppMessageSend = z.infer<typeof WhatsAppMessageSendSchema>;
export type WhatsAppMessageListQuery = z.infer<typeof WhatsAppMessageListQuerySchema>;
export type WhatsAppMessageResponse = z.infer<typeof WhatsAppMessageResponseSchema>;
export type WhatsAppMessageListResponse = z.infer<typeof WhatsAppMessageListResponseSchema>;
