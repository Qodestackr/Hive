import { emailService } from "@repo/notifications";
import { logger } from "better-auth";

/**
 * Send password reset email to user
 */
export async function sendPasswordResetEmail(
	email: string,
	userName: string,
	resetUrl: string,
) {
	try {
		await emailService.sendPasswordResetEmail({
			to: email,
			userName,
			resetUrl,
			supportEmail: "support@promco.co",
		});
		logger.info(`✅ Password reset email sent to ${email}`);
		return { success: true };
	} catch (error) {
		logger.error(`❌ Failed to send password reset email to ${email}:`, error);
		return { success: false, error };
	}
}

/**
 * Send user invitation email
 */
export async function sendUserInviteEmail({
	email,
	inviterName,
	inviteeName,
	organizationName,
	role,
	inviteToken,
	expiresIn,
	supportEmail,
}: {
	email: string;
	inviterName: string;
	inviteeName: string;
	organizationName: string;
	role: string;
	inviteToken: string;
	expiresIn?: string;
	supportEmail?: string;
}) {
	try {
		await emailService.sendUserInviteEmail({
			email,
			inviterName,
			inviteeName,
			organizationName,
			role,
			inviteToken,
			expiresIn,
		});
		logger.info(`✅ User invite email sent to ${email}`);
		return { success: true };
	} catch (error) {
		logger.error(`❌ Failed to send user invite email to ${email}:`, error);
		return { success: false, error };
	}
}
