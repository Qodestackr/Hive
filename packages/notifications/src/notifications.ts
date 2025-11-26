import { resend } from "./email/email";

// Email notifications
export const sendEmailNotification = async (
	connection: any /**typeof email.$inferInsert */,
	subject: string,
	htmlContent: string,
) => {
	try {
		const {
			smtpServer,
			smtpPort,
			username,
			password,
			fromAddress,
			toAddresses,
		} = connection;

		// Use Resend if configured, otherwise fallback to SMTP[LOCAL VS PROD]
		if (process.env.USE_RESEND === "true") {
			await resend.emails.send({
				from: fromAddress,
				to: toAddresses,
				subject,
				html: htmlContent,
			});
		} else {
			const nodemailer = await import("nodemailer");
			const transporter = nodemailer.default.createTransport({
				host: smtpServer,
				port: smtpPort,
				auth: { user: username, pass: password },
			});

			await transporter.sendMail({
				from: fromAddress,
				to: toAddresses.join(", "),
				subject,
				html: htmlContent,
			});
		}
	} catch (err) {
		console.error("Email notification error:", err);
		throw new Error(
			`Failed to send email: ${
				err instanceof Error ? err.message : String(err)
			}`,
		);
	}
};

// WhatsApp notifications (using Twilio)
export interface WhatsAppConnection {
	accountSid: string;
	authToken: string;
	fromNumber: string; // Twilio WhatsApp number
}

export const sendWhatsAppNotification = async (
	connection: WhatsAppConnection,
	toNumber: string,
	message: string,
) => {
	try {
		const { accountSid, authToken, fromNumber } = connection;
		const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
		const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

		const formData = new URLSearchParams();
		formData.append("From", `whatsapp:${fromNumber}`);
		formData.append("To", `whatsapp:${toNumber}`);
		formData.append("Body", message);

		const response = await fetch(url, {
			method: "POST",
			headers: {
				Authorization: `Basic ${auth}`,
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: formData,
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => null);
			throw new Error(
				`Twilio API error: ${response.status} ${
					response.statusText
				} ${JSON.stringify(errorData)}`,
			);
		}

		return response;
	} catch (err) {
		console.error("WhatsApp notification error:", err);
		throw new Error(
			`Failed to send WhatsApp notification: ${
				err instanceof Error ? err.message : String(err)
			}`,
		);
	}
};

// SMS notifications (using Twilio)
export interface SMSConnection {
	accountSid: string;
	authToken: string;
	fromNumber: string;
}

export const sendSMSNotification = async (
	connection: SMSConnection,
	toNumber: string,
	message: string,
) => {
	try {
		const { accountSid, authToken, fromNumber } = connection;
		const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
		const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

		const formData = new URLSearchParams();
		formData.append("From", fromNumber);
		formData.append("To", toNumber);
		formData.append("Body", message);

		const response = await fetch(url, {
			method: "POST",
			headers: {
				Authorization: `Basic ${auth}`,
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: formData,
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => null);
			throw new Error(
				`Twilio API error: ${response.status} ${
					response.statusText
				} ${JSON.stringify(errorData)}`,
			);
		}

		return response;
	} catch (err) {
		console.error("SMS notification error:", err);
		throw new Error(
			`Failed to send SMS notification: ${
				err instanceof Error ? err.message : String(err)
			}`,
		);
	}
};

export interface PushNotificationConnection {
	serverKey: string;
}

export interface PushNotificationPayload {
	title: string;
	body: string;
	icon?: string;
	clickAction?: string;
	data?: Record<string, string>;
}

export const sendPushNotification = async (
	connection: PushNotificationConnection,
	token: string | string[],
	payload: PushNotificationPayload,
) => {
	try {
		const tokens = Array.isArray(token) ? token : [token];
		const url = "https://fcm.googleapis.com/fcm/send";

		const response = await fetch(url, {
			method: "POST",
			headers: {
				Authorization: `key=${connection.serverKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				registration_ids: tokens,
				notification: {
					title: payload.title,
					body: payload.body,
					icon: payload.icon,
					click_action: payload.clickAction,
				},
				data: payload.data || {},
			}),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => null);
			throw new Error(
				`FCM API error: ${response.status} ${
					response.statusText
				} ${JSON.stringify(errorData)}`,
			);
		}

		return response;
	} catch (err) {
		console.error("Push notification error:", err);
		throw new Error(
			`Failed to send push notification: ${
				err instanceof Error ? err.message : String(err)
			}`,
		);
	}
};
