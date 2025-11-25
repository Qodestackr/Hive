export { WelcomeEmail } from "./welcome-email"
export { PasswordResetEmail } from "./password-reset"
export { UserInviteEmail } from "./user-invite"

export type EmailTemplate =
  | "WELCOME"
  | "PASSWORD_RESET"
  | "USER_INVITE"
  | "EMAIL_VERIFICATION"
  | "SUBSCRIPTION_EXPIRE"
  | "ORG_INVITE"
  | "DAILY_SUMMARY"
  | "LOW_STOCK_ALERT"
  | "BIZ_INSIGHTS"
