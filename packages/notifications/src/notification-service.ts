import { resend } from "./email/email";
import {
	type PushNotificationConnection,
	type PushNotificationPayload,
	type SMSConnection,
	sendEmailNotification,
	sendPushNotification,
	sendSMSNotification,
	sendWhatsAppNotification,
	type WhatsAppConnection,
} from "./notifications";

/**
 * Send an email notification using either Resend or SMTP
 */
export const sendEmail = async ({
	email,
	subject,
	text,
	html,
	from = process.env.EMAIL_FROM || "online@promco.co",
}: {
	email: string | string[];
	subject: string;
	text: string;
	html?: string;
	from?: string;
}) => {
	const toAddresses = Array.isArray(email) ? email : [email];

	// If Resend API key is available, use Resend
	if (process.env.RESEND_API_KEY) {
		try {
			await resend.emails.send({
				from,
				to: toAddresses,
				subject,
				text,
				html: html || text,
			});
			return true;
		} catch (error) {
			console.error("Resend email failed, falling back to SMTP:", error);
			// Fall back to SMTP if Resend fails
		}
	}

	// Otherwise use SMTP
	await sendEmailNotification(
		{
			fromAddress: from,
			toAddresses,
			smtpServer: process.env.SMTP_SERVER || "",
			smtpPort: Number(process.env.SMTP_PORT) || 587,
			username: process.env.SMTP_USERNAME || "",
			password: process.env.SMTP_PASSWORD || "",
		},
		subject,
		html || text,
	);
	return true;
};

/**
 * Send a WhatsApp message
 */
export const sendWhatsAppMessage = async ({
	to,
	message,
	customConnection,
}: {
	to: string;
	message: string;
	customConnection?: WhatsAppConnection;
}) => {
	const connection: WhatsAppConnection = customConnection || {
		accountSid: process.env.TWILIO_ACCOUNT_SID || "",
		authToken: process.env.TWILIO_AUTH_TOKEN || "",
		fromNumber: process.env.TWILIO_WHATSAPP_NUMBER || "",
	};

	if (
		!connection.accountSid ||
		!connection.authToken ||
		!connection.fromNumber
	) {
		console.warn("WhatsApp configuration missing");
		return false;
	}

	await sendWhatsAppNotification(connection, to, message);
	return true;
};

/**
 * Send an SMS message
 */
export const sendSMS = async ({
	to,
	message,
	customConnection,
}: {
	to: string;
	message: string;
	customConnection?: SMSConnection;
}) => {
	const connection: SMSConnection = customConnection || {
		accountSid: process.env.TWILIO_ACCOUNT_SID || "",
		authToken: process.env.TWILIO_AUTH_TOKEN || "",
		fromNumber: process.env.TWILIO_SMS_NUMBER || "",
	};

	if (
		!connection.accountSid ||
		!connection.authToken ||
		!connection.fromNumber
	) {
		console.warn("SMS configuration missing");
		return false;
	}

	await sendSMSNotification(connection, to, message);
	return true;
};

/**
 * Send a push notification
 */
export const sendPush = async ({
	token,
	title,
	body,
	icon = "/favicon.ico",
	clickAction,
	data,
	customConnection,
}: {
	token: string | string[];
	title: string;
	body: string;
	icon?: string;
	clickAction?: string;
	data?: Record<string, string>;
	customConnection?: PushNotificationConnection;
}) => {
	const connection: PushNotificationConnection = customConnection || {
		serverKey: process.env.FCM_SERVER_KEY || "",
	};

	if (!connection.serverKey) {
		console.warn("Push notification configuration missing");
		return false;
	}

	const payload: PushNotificationPayload = {
		title,
		body,
		icon,
		clickAction,
		data,
	};

	await sendPushNotification(connection, token, payload);
	return true;
};

/**
 * Helper to send notifications across multiple channels
 */
export const notifyUser = async ({
	user,
	subject,
	body,
	channels = ["email"],
}: {
	user: {
		email: string;
		phone?: string;
		fcmToken?: string;
		whatsappNumber?: string;
		notificationPreferences?: {
			email?: boolean;
			sms?: boolean;
			push?: boolean;
			whatsapp?: boolean;
		};
	};
	subject: string;
	body: string;
	channels?: ("email" | "sms" | "push" | "whatsapp")[];
}) => {
	const results: Record<string, boolean> = {};
	const prefs = user.notificationPreferences || {};

	// Determine channels based on user preferences
	const enabledChannels = channels.filter((channel) => {
		if (channel === "email" && prefs.email !== false) return true;
		if (channel === "sms" && prefs.sms === true && user.phone) return true;
		if (channel === "push" && prefs.push !== false && user.fcmToken)
			return true;
		if (
			channel === "whatsapp" &&
			prefs.whatsapp === true &&
			user.whatsappNumber
		)
			return true;
		return false;
	});

	// Send notifications through each enabled channel
	for (const channel of enabledChannels) {
		try {
			if (channel === "email") {
				results.email = await sendEmail({
					email: user.email,
					subject,
					text: body,
				});
			} else if (channel === "sms" && user.phone) {
				results.sms = await sendSMS({
					to: user.phone,
					message: `${subject}: ${body}`,
				});
			} else if (channel === "push" && user.fcmToken) {
				results.push = await sendPush({
					token: user.fcmToken,
					title: subject,
					body,
				});
			} else if (channel === "whatsapp" && user.whatsappNumber) {
				results.whatsapp = await sendWhatsAppMessage({
					to: user.whatsappNumber,
					message: `*${subject}*\n\n${body}`,
				});
			}
		} catch (error) {
			console.error(`Failed to send ${channel} notification:`, error);
			results[channel] = false;
		}
	}

	return results;
};
