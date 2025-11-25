export interface NotificationPayload {
    id: string
    type: NotificationType
    recipient: string // email, phone, or user ID
    subject?: string
    content: string
    data?: Record<string, any>
    scheduledFor?: Date
    priority: NotificationPriority
    organizationId?: string
    userId?: string
}

export enum NotificationType {
    EMAIL = "email",
    SMS = "sms",
    PUSH = "push",
    IN_APP = "in_app",
}

export enum NotificationPriority {
    LOW = "low",
    NORMAL = "normal",
    HIGH = "high",
    URGENT = "urgent",
}

export enum NotificationTemplate {
    // Authentication
    WELCOME = "WELCOME",
    EMAIL_VERIFICATION = "EMAIL_VERIFICATION",
    PASSWORD_RESET = "PASSWORD_RESET",
    TWO_FACTOR = "TWO_FACTOR",
    USER_INVITE = "USER_INVITE",

    // Business Operations
    ORDER_CONFIRMATION = "ORDER_CONFIRMATION",
    ORDER_SHIPPED = "ORDER_SHIPPED",
    ORDER_DELIVERED = "ORDER_DELIVERED",
    PAYMENT_RECEIVED = "PAYMENT_RECEIVED",
    PAYMENT_FAILED = "PAYMENT_FAILED",

    // Inventory
    LOW_STOCK_ALERT = "LOW_STOCK_ALERT",
    STOCK_RECEIVED = "STOCK_RECEIVED",
    PRICE_CHANGE = "PRICE_CHANGE",

    // Reports
    DAILY_SUMMARY = "DAILY_SUMMARY",
    WEEKLY_REPORT = "WEEKLY_REPORT",
    MONTHLY_REPORT = "MONTHLY_REPORT",

    // System
    SYSTEM_MAINTENANCE = "SYSTEM_MAINTENANCE",
    FEATURE_ANNOUNCEMENT = "FEATURE_ANNOUNCEMENT",
    SECURITY_ALERT = "SECURITY_ALERT",

    // BNPL
    BNPL_APPROVED = "BNPL_APPROVED",
    BNPL_DECLINED = "BNPL_DECLINED",
    BNPL_PAYMENT_DUE = "BNPL_PAYMENT_DUE",
    BNPL_PAYMENT_OVERDUE = "BNPL_PAYMENT_OVERDUE",
}

export interface EmailOptions {
    to: string | string[]
    cc?: string | string[]
    bcc?: string | string[]
    subject: string
    template: NotificationTemplate
    data: Record<string, any>
    attachments?: Array<{
        filename: string
        content: Buffer | string
        contentType?: string
    }>
}

export interface SMSOptions {
    to: string
    message: string
    template?: NotificationTemplate
    data?: Record<string, any>
}

export interface PushOptions {
    userId: string
    title: string
    body: string
    data?: Record<string, any>
    icon?: string
    badge?: string
    image?: string
    actions?: Array<{
        action: string
        title: string
        icon?: string
    }>
}

export interface NotificationResult {
    success: boolean
    messageId?: string
    error?: string
    provider?: string
}
