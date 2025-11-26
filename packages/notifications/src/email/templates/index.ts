export { PasswordResetEmail } from "./password-reset";
export { UserInviteEmail } from "./user-invite";
export { WelcomeEmail } from "./welcome-email";

export type EmailTemplate =
	| "WELCOME"
	| "PASSWORD_RESET"
	| "USER_INVITE"
	| "EMAIL_VERIFICATION"
	| "SUBSCRIPTION_EXPIRE"
	| "ORG_INVITE"
	| "DAILY_SUMMARY"
	| "LOW_STOCK_ALERT"
	| "BIZ_INSIGHTS";
