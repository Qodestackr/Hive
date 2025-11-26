import { env } from "@repo/utils";
import type { NotificationResult, SMSOptions } from "./types";

export class SMSService {
	private apiKey: string;
	private username: string;

	constructor() {
		this.apiKey = env.AFRICASTALKING_API_KEY || "";
		this.username = env.AFRICASTALKING_USERNAME || "sandbox";
	}

	async sendSMS(options: SMSOptions): Promise<NotificationResult> {
		try {
			if (!this.apiKey) {
				console.warn("SMS service not configured, skipping SMS");
				return { success: false, error: "SMS service not configured" };
			}

			const formattedPhone = this.formatPhoneNumber(options.to);

			const response = await fetch(
				"https://api.africastalking.com/version1/messaging",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
						apiKey: this.apiKey,
					},
					body: new URLSearchParams({
						username: this.username,
						to: formattedPhone,
						message: options.message,
					}),
				},
			);

			const result = await response.json();

			if (result.SMSMessageData?.Recipients?.[0]?.status === "Success") {
				return {
					success: true,
					messageId: result.SMSMessageData.Recipients[0].messageId,
					provider: "africastalking",
				};
			}

			return {
				success: false,
				error:
					result.SMSMessageData?.Recipients?.[0]?.status || "SMS send failed",
			};
		} catch (error) {
			console.error("SMS service error:", error);
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	private formatPhoneNumber(phone: string): string {
		const cleaned = phone.replace(/\D/g, "");
		if (cleaned.startsWith("254")) {
			return `+${cleaned}`;
		}
		if (cleaned.startsWith("0")) {
			return `+254${cleaned.slice(1)}`;
		}
		if (cleaned.length === 9) {
			return `+254${cleaned}`;
		}

		return `+${cleaned}`;
	}

	async sendOrderConfirmation(
		phone: string,
		orderNumber: string,
		amount: number,
	): Promise<NotificationResult> {
		const message = `Order ${orderNumber} confirmed! Total: KES ${amount.toLocaleString()}. Thank you for choosing Promco Platform.`;
		return this.sendSMS({ to: phone, message });
	}

	async sendPaymentConfirmation(
		phone: string,
		amount: number,
		reference: string,
	): Promise<NotificationResult> {
		const message = `Payment of KES ${amount.toLocaleString()} received. Reference: ${reference}. Thank you!`;
		return this.sendSMS({ to: phone, message });
	}

	async sendLowStockAlert(
		phone: string,
		productName: string,
		currentStock: number,
	): Promise<NotificationResult> {
		const message = `Low Stock Alert: ${productName} has only ${currentStock} units remaining. Please restock soon.`;
		return this.sendSMS({ to: phone, message });
	}
}

export const smsService = new SMSService();
