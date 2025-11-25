import db from "@repo/db";
import { sendPush } from "./notification-service";
import { logger } from "@repo/utils";

/**
 * Send a push notification to a user via FCM
 * This handles the complete flow: create notification record + send via FCM
 */
export async function sendNotificationToUser({
    userId,
    title,
    body,
    type = "GENERAL",
    link,
    metadata = {},
}: {
    userId: string;
    title: string;
    body: string;
    type?: string;
    link?: string;
    metadata?: Record<string, any>;
}) {
    try {
        // 1. Get user's FCM tokens
        const fcmTokens = await db.fCMToken.findMany({
            where: {
                userId,
                valid: true,
            },
        });

        if (fcmTokens.length === 0) {
            logger.warn(`No valid FCM tokens found for user ${userId}`);
            return { success: false, error: "No FCM tokens found" };
        }

        // 2. Create notification record in database
        const notification = await db.notification.create({
            data: {
                userId,
                title,
                body,
                type: type.toUpperCase() as any,
                link,
                metadata,
                status: "PENDING",
                channel: "PUSH",
            },
        });

        // 3. Send push notification to all valid tokens
        const tokens = fcmTokens.map((t) => t.token);
        const sendResults: Record<string, boolean> = {};

        for (const token of tokens) {
            try {
                await sendPush({
                    token,
                    title,
                    body,
                    clickAction: link,
                    data: {
                        notificationId: notification.id,
                        type,
                        link: link || "",
                        ...metadata,
                    },
                });

                sendResults[token] = true;
                logger.info(`✅ Push notification sent to token: ${token.slice(0, 20)}...`);
            } catch (error) {
                sendResults[token] = false;
                logger.error(`❌ Failed to send push to token: ${token.slice(0, 20)}...`, error as Error);

                // Mark token as invalid if it fails
                await db.fCMToken.update({
                    where: { token },
                    data: {
                        valid: false,
                        fcmError: String(error),
                    },
                });
            }
        }

        // 4. Update notification status
        const successCount = Object.values(sendResults).filter(Boolean).length;
        const status = successCount > 0 ? "SENT" : "FAILED";

        await db.notification.update({
            where: { id: notification.id },
            data: {
                status,
                sentAt: new Date(),
            },
        });

        logger.info(
            `📨 Notification sent to user ${userId}: ${successCount}/${tokens.length} tokens successful`
        );

        return {
            success: successCount > 0,
            notification,
            sendResults,
            successCount,
            totalTokens: tokens.length,
        };
    } catch (error) {
        logger.error(`Error sending notification to user ${userId}:`, error as Error);
        return { success: false, error: String(error) };
    }
}


/**
 * Send notifications to multiple users
 */
export async function sendNotificationToUsers({
    userIds,
    title,
    body,
    type = "GENERAL",
    link,
    metadata = {},
}: {
    userIds: string[];
    title: string;
    body: string;
    type?: string;
    link?: string;
    metadata?: Record<string, any>;
}) {
    const results = await Promise.all(
        userIds.map((userId) =>
            sendNotificationToUser({
                userId,
                title,
                body,
                type,
                link,
                metadata,
            })
        )
    );

    const successCount = results.filter((r) => r.success).length;
    logger.info(
        `📨 Batch notification sent: ${successCount}/${userIds.length} users successful`
    );

    return {
        success: successCount > 0,
        results,
        successCount,
        totalUsers: userIds.length,
    };
}

/**
 * Send notification to all users of an organization
 */
export async function sendNotificationToOrganization({
    organizationId,
    title,
    body,
    type = "GENERAL",
    link,
    metadata = {},
}: {
    organizationId: string;
    title: string;
    body: string;
    type?: string;
    link?: string;
    metadata?: Record<string, any>;
}) {
    try {
        // Get all users in organization
        const users = await db.user.findMany({
            where: {
                // Assuming there's a relationship through organization
                // Adjust based on your actual schema
            },
            select: { id: true },
        });

        const userIds = users.map((u) => u.id);
        return sendNotificationToUsers({
            userIds,
            title,
            body,
            type,
            link,
            metadata: { ...metadata, organizationId },
        });
    } catch (error) {
        logger.error(`Error sending notification to organization ${organizationId}:`, error as Error);
        return { success: false, error: String(error) };
    }
}


/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string, userId: string) {
    try {
        const notification = await db.notification.update({
            where: {
                id: notificationId,
                userId,
            },
            data: {
                read: true,
                readAt: new Date(),
                status: "READ",
            },
        });

        return { success: true, notification };
    } catch (error) {
        logger.error(`Error marking notification as read:`, error as Error);
        return { success: false, error: String(error) };
    }
}


/**
 * Clean up invalid/expired FCM tokens
 */
export async function cleanupInvalidTokens() {
    try {
        const deleted = await db.fCMToken.deleteMany({
            where: {
                OR: [
                    { valid: false },
                    { expiresAt: { lt: new Date() } },
                    { lastUsedAt: { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
                ],
            },
        });

        logger.info(`🗑️ Cleaned up ${deleted.count} invalid FCM tokens`);
        return { success: true, deletedCount: deleted.count };
    } catch (error) {
        logger.error(`Error cleaning up FCM tokens:`, error as Error);
        return { success: false, error: String(error) };
    }
}
