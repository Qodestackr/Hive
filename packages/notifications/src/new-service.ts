// import admin from "firebase-admin";
// import db from "@workspace/db";

// // Initialize Firebase Admin (do this once in your app)
// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert({
//       projectId: process.env.FIREBASE_PROJECT_ID,
//       clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
//       privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
//     }),
//   });
// }

// interface NotificationPayload {
//   userId: string;
//   title: string;
//   body: string;
//   link?: string;
//   type?: string;
//   priority?: string;
//   metadata?: Record<string, any>;
// }

// export class NotificationService {
//   /**
//    * Send notification to a specific user
//    */
//   static async sendToUser(payload: NotificationPayload) {
//     const {
//       userId,
//       title,
//       body,
//       link,
//       type = "GENERAL",
//       priority = "NORMAL",
//       metadata = {},
//     } = payload;

//     try {
//       // 1. Check user notification preferences
//       const settings = await db.notificationSettings.findUnique({
//         where: { userId },
//       });

//       // Skip if user disabled this type
//       const typeKey = type.toLowerCase() as keyof typeof settings;
//       if (settings && typeKey in settings && !settings[typeKey]) {
//         console.log(`User ${userId} has disabled ${type} notifications`);
//         return { success: false, reason: "user_preference" };
//       }

//       // 2. Create notification record
//       const notification = await db.notification.create({
//         data: {
//           userId,
//           title,
//           body,
//           link,
//           type: type as NotificationType,
//           priority,
//           channel: "PUSH",
//           status: "PENDING",
//           metadata,
//         },
//       });

//       // 3. Fetch all valid FCM tokens for user
//       const tokens = await db.fCMToken.findMany({
//         where: {
//           userId,
//           valid: true,
//         },
//         select: { id: true, token: true },
//       });

//       if (tokens.length === 0) {
//         await db.notification.update({
//           where: { id: notification.id },
//           data: { status: "FAILED", metadata: { reason: "no_tokens" } },
//         });
//         return { success: false, reason: "no_tokens" };
//       }

//       // 4. Prepare FCM message
//       const message: admin.messaging.MulticastMessage = {
//         notification: {
//           title,
//           body,
//         },
//         data: {
//           link: link || "",
//           notificationId: notification.id,
//           type,
//           ...metadata,
//         },
//         tokens: tokens.map((t) => t.token),
//         webpush: link
//           ? {
//               fcmOptions: {
//                 link,
//               },
//             }
//           : undefined,
//       };

//       // 5. Send via FCM
//       const response = await admin.messaging().sendEachForMulticast(message);

//       // 6. Process responses and handle invalid tokens
//       const updates = response.responses.map(async (r, idx) => {
//         const tokenRecord = tokens[idx];

//         if (r.success) {
//           // Update notification as sent
//           await db.notification.update({
//             where: { id: notification.id },
//             data: {
//               status: "SENT",
//               sentAt: new Date(),
//               fcmTokenId: tokenRecord.id,
//             },
//           });

//           // Update token last used
//           await db.fCMToken.update({
//             where: { id: tokenRecord.id },
//             data: { lastUsedAt: new Date() },
//           });
//         } else {
//           const errorCode = r.error?.code;

//           // Invalidate token if permanently failed
//           if (
//             errorCode === "messaging/registration-token-not-registered" ||
//             errorCode === "messaging/invalid-registration-token"
//           ) {
//             await db.fCMToken.update({
//               where: { id: tokenRecord.id },
//               data: {
//                 valid: false,
//                 fcmError: errorCode,
//               },
//             });
//           }

//           console.error(`Failed to send to token ${tokenRecord.id}:`, errorCode);
//         }
//       });

//       await Promise.all(updates);

//       // 7. Update notification status based on results
//       const anySuccess = response.responses.some((r) => r.success);
//       if (anySuccess) {
//         await db.notification.update({
//           where: { id: notification.id },
//           data: {
//             status: "SENT",
//             sentAt: new Date(),
//           },
//         });
//       } else {
//         await db.notification.update({
//           where: { id: notification.id },
//           data: {
//             status: "FAILED",
//             metadata: { fcmErrors: response.responses.map((r) => r.error?.code) },
//           },
//         });
//       }

//       return {
//         success: anySuccess,
//         successCount: response.successCount,
//         failureCount: response.failureCount,
//         notificationId: notification.id,
//       };
//     } catch (error) {
//       console.error("Error sending notification:", error);
//       throw error;
//     }
//   }

//   /**
//    * Send notification to multiple users
//    */
//   static async sendToUsers(userIds: string[], payload: Omit<NotificationPayload, "userId">) {
//     const results = await Promise.allSettled(
//       userIds.map((userId) =>
//         this.sendToUser({ ...payload, userId })
//       )
//     );

//     return {
//       total: userIds.length,
//       successful: results.filter((r) => r.status === "fulfilled").length,
//       failed: results.filter((r) => r.status === "rejected").length,
//     };
//   }

//   /**
//    * Send notification based on event
//    */
//   static async sendOrderNotification(orderId: string, status: string) {
//     // Fetch order and user details
//     const order = await db.order.findUnique({
//       where: { id: orderId },
//       include: { user: true },
//     });

//     if (!order) return;

//     const statusMessages: Record<string, { title: string; body: string }> = {
//       confirmed: {
//         title: "Order Confirmed 🎉",
//         body: `Your order #${order.orderNumber} has been confirmed`,
//       },
//       shipped: {
//         title: "Order Shipped 📦",
//         body: `Your order #${order.orderNumber} is on its way`,
//       },
//       delivered: {
//         title: "Order Delivered ✅",
//         body: `Your order #${order.orderNumber} has been delivered`,
//       },
//     };

//     const message = statusMessages[status];
//     if (!message) return;

//     await this.sendToUser({
//       userId: order.userId,
//       ...message,
//       link: `/orders/${orderId}`,
//       type: "ORDERS",
//       priority: "NORMAL",
//       metadata: { orderId, status },
//     });
//   }

//   /**
//    * Send low stock alert
//    */
//   static async sendLowStockAlert(productId: string, currentStock: number) {
//     // Fetch product and organization admins
//     const product = await db.product.findUnique({
//       where: { id: productId },
//       include: {
//         organization: {
//           include: {
//             members: {
//               where: { role: { in: ["OWNER", "ADMIN"] } },
//             },
//           },
//         },
//       },
//     });

//     if (!product) return;

//     const adminIds = product.organization.members.map((m) => m.userId);

//     await this.sendToUsers(adminIds, {
//       title: `Low Stock Alert: ${product.name}`,
//       body: `Only ${currentStock} units remaining. Consider reordering soon.`,
//       link: `/inventory/${productId}`,
//       type: "INVENTORY",
//       priority: "WARNING",
//       metadata: { productId, currentStock },
//     });
//   }

//   /**
//    * Send payment overdue alert
//    */
//   static async sendPaymentOverdueAlert(invoiceId: string, daysOverdue: number) {
//     const invoice = await db.invoice.findUnique({
//       where: { id: invoiceId },
//     });

//     if (!invoice) return;

//     await this.sendToUser({
//       userId: invoice.userId,
//       title: "Payment Overdue ⚠️",
//       body: `Payment of ${invoice.amount} is ${daysOverdue} days overdue. Please settle to avoid service interruption.`,
//       link: `/invoices/${invoiceId}`,
//       type: "PAYMENTS",
//       priority: "CRITICAL",
//       metadata: { invoiceId, daysOverdue, amount: invoice.amount },
//     });
//   }
// }

// // Example usage in your backend:
// // await NotificationService.sendOrderNotification(orderId, "shipped");
// // await NotificationService.sendLowStockAlert(productId, 10);
// // await NotificationService.sendPaymentOverdueAlert(invoiceId, 3);
