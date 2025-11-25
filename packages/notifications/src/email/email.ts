import { Resend } from "resend"
import { APP_BASE_URL } from "@repo/utils"
import type { EmailOptions, NotificationResult, NotificationTemplate } from "../types"
import { WelcomeEmail, PasswordResetEmail, UserInviteEmail } from "./templates"
import { VerificationEmail } from "./templates/verification-email"

export const resend = new Resend("re_ShPG17FF_B2FShDxtWMf1uCzsERr8KoDJ")//env.RESEND_API_KEY

export class EmailService {
  private from: string

  constructor() {
    this.from = "Promco Platform <online@promco.co>"
  }

  private getEmailTemplate(template: NotificationTemplate, data: Record<string, any>) {
    switch (template) {
      case "WELCOME":
        return WelcomeEmail({
          name: data.name,
          organizationName: data.organizationName,
          loginUrl: data.loginUrl,
        })
      case "PASSWORD_RESET":
        return PasswordResetEmail({
          name: data.name,
          resetUrl: data.resetUrl,
        })
      case "USER_INVITE":
        return UserInviteEmail({
          inviterName: data.inviterName,
          inviteeName: data.inviteeName,
          organizationName: data.organizationName,
          role: data.role,
          inviteUrl: data.inviteUrl,
          expiresIn: data.expiresIn,
        })
      case "EMAIL_VERIFICATION":
        return VerificationEmail({
          verificationUrl: data.verificationUrl,
          token: data.token,
          userName: data.userName,
        })
      default:
        throw new Error(`Unknown email template: ${template}`)
    }
  }

  async sendEmail(options: EmailOptions): Promise<NotificationResult> {
    try {
      // if (!env.RESEND_API_KEY) {
      //   console.warn("RESEND_API_KEY not configured, skipping email")
      //   return { success: false, error: "Email service not configured" }
      // }

      const template = this.getEmailTemplate(options.template, options.data)

      const result = await resend.emails.send({
        from: this.from,
        to: Array.isArray(options.to) ? options.to : [options.to],
        cc: options.cc,
        bcc: options.bcc,
        subject: options.subject,
        react: template,
        attachments: options.attachments,
      })

      if (result.error) {
        console.error("Email send error:", result.error)
        return { success: false, error: result.error.message }
      }

      return {
        success: true,
        messageId: result.data?.id,
        provider: "resend",
      }
    } catch (error) {
      console.error("Email service error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async sendWelcomeEmail({
    email,
    name,
    organizationName,
    loginUrl,
  }: {
    email: string
    name: string
    organizationName?: string
    loginUrl?: string
  }): Promise<NotificationResult> {
    return this.sendEmail({
      to: email,
      subject: `Welcome to Promco Platform${organizationName ? ` - ${organizationName}` : ""}`,
      template: "WELCOME" as NotificationTemplate,
      data: { name, organizationName, loginUrl },
    })
  }

  async sendPasswordResetEmail(options: {
    to: string
    userName: string
    resetUrl: string
    supportEmail?: string
  }): Promise<NotificationResult> {
    return this.sendEmail({
      to: options.to,
      subject: "Reset Your Password - Promco Platform",
      template: "PASSWORD_RESET" as NotificationTemplate,
      data: {
        name: options.userName,
        resetUrl: options.resetUrl,
        supportEmail: options.supportEmail || "support@promco.co",
      },
    })
  }

  async sendUserInviteEmail({
    email,
    inviterName,
    inviteeName,
    organizationName,
    role,
    inviteToken,
    expiresIn,
  }: {
    email: string
    inviterName: string
    inviteeName: string
    organizationName: string
    role: string
    inviteToken: string
    expiresIn?: string
  }): Promise<NotificationResult> {
    const inviteUrl = `${APP_BASE_URL}/accept-invitation/${inviteToken}`
    return this.sendEmail({
      to: email,
      subject: `You're invited to join ${organizationName} on Promco Platform`,
      template: "USER_INVITE" as NotificationTemplate,
      data: { inviterName, inviteeName, organizationName, role, inviteUrl, expiresIn },
    })
  }

  async sendVerificationEmail({
    email,
    verificationUrl,
    userName,
    token,
  }: {
    email: string
    verificationUrl: string
    userName?: string
    token?: string
  }): Promise<NotificationResult> {
    return this.sendEmail({
      to: email,
      subject: "Verify Your Email Address - Promco Platform",
      template: "EMAIL_VERIFICATION" as NotificationTemplate,
      data: { verificationUrl, token, userName },
    })
  }

  async sendDailySummary(
    email: string,
    organizationName: string,
    summaryData: Record<string, any>,
  ): Promise<NotificationResult> {
    return this.sendEmail({
      to: email,
      subject: `Daily Summary - ${organizationName}`,
      template: "DAILY_SUMMARY" as NotificationTemplate,
      data: { organizationName, ...summaryData },
    })
  }
}

export const emailService = new EmailService()
