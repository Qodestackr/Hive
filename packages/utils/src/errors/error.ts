import { trace } from "@opentelemetry/api";

/**
 * 1. Raw Failure → Captured Input
 *    - System catches ANY error: runtime exceptions, strings, DB errors, business rules
 *    - Goal: Never let chaos leak into the system
 * 
 * 2. Normalization → PromcoError
 *    - Convert unpredictable input into clean, structured domain error
 *    - toPromcoError() handles all conversion logic
 * 
 * 3. Telemetry → Trace + Span Enrichment
 * 4. Logging → Structured Machine Logs
 *    - Generate structured logs (info/warn/error)
 *    - Safe for ingestion by any platform
 * 
 * 5. API Surface → RFC 7807 Problem Document
 *    - Return standardized, predictable error response
 *    - Content-Type: application/problem+json
 */
export enum ErrorCode {
    // Validation (400)
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
    INVALID_FORMAT = 'INVALID_FORMAT',

    // Authentication (401)
    UNAUTHORIZED = 'UNAUTHORIZED',
    TOKEN_EXPIRED = 'TOKEN_EXPIRED',

    // Authorization (403)
    FORBIDDEN = 'FORBIDDEN',

    // Resources (404, 409)
    RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
    DUPLICATE_RECORD = 'DUPLICATE_RECORD',

    // Business Logic (422)
    BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
    INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',

    // External Services (502, 429, 504)
    EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
    TIMEOUT_ERROR = 'TIMEOUT_ERROR',

    // Internal (500)
    DATABASE_ERROR = 'DATABASE_ERROR',
    INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
    CONFIGURATION_ERROR = 'CONFIGURATION_ERROR'
}

export interface ErrorContext {
    // Standard fields
    userId?: string;
    organizationId?: string;
    requestId?: string;
    traceId?: string;
    spanId?: string;

    // Operation context
    operation?: string;
    resource?: string;

    // Request context
    url?: string;
    method?: string;
    params?: Record<string, any>;

    // Error details
    field?: string;           // For validation errors
    rule?: string;            // For business rule violations
    service?: string;         // For external service errors
    table?: string;           // For database errors
    originalError?: string;   // Original error message

    // Timestamps
    timestamp?: string;

    // Extensible for any domain-specific context
    [key: string]: any;
}

// domain err class
export class PromcoError extends Error {
    public readonly code: ErrorCode;
    public readonly statusCode: number;
    public readonly context: ErrorContext;
    public readonly timestamp: Date;
    public readonly isOperational: boolean;

    constructor(
        code: ErrorCode,
        message: string,
        statusCode: number = 500,
        context: ErrorContext = {},
        isOperational: boolean = true
    ) {
        super(message);
        this.name = 'PromcoError';
        this.code = code;
        this.statusCode = statusCode;
        this.context = context;
        this.timestamp = new Date();
        this.isOperational = isOperational;
    }

    toJSON() {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
            statusCode: this.statusCode,
            context: this.context,
            timestamp: this.timestamp.toISOString(),
            stack: this.stack
        };
    }
}

// ERROR FACTORY - Type-Safe Error Creation
export const createError = {
    validation: (message: string, field?: string, context?: ErrorContext) =>
        new PromcoError(
            ErrorCode.VALIDATION_ERROR,
            message,
            400,
            { ...context, field }
        ),
    unauthorized: (message: string = 'Unauthorized access', context?: ErrorContext) =>
        new PromcoError(
            ErrorCode.UNAUTHORIZED,
            message,
            401,
            context
        ),
    forbidden: (message: string = 'Access forbidden', context?: ErrorContext) =>
        new PromcoError(
            ErrorCode.FORBIDDEN,
            message,
            403,
            context
        ),
    notFound: (resource: string, context?: ErrorContext) =>
        new PromcoError(
            ErrorCode.RECORD_NOT_FOUND,
            `${resource} not found`,
            404,
            { ...context, resource }
        ),
    conflict: (message: string, context?: ErrorContext) =>
        new PromcoError(
            ErrorCode.DUPLICATE_RECORD,
            message,
            409,
            context
        ),
    // when valid input violates business logic
    businessRule: (rule: string, context?: ErrorContext) =>
        new PromcoError(
            ErrorCode.BUSINESS_RULE_VIOLATION,
            `Business rule violation: ${rule}`,
            422,
            { ...context, rule }
        ),
    // third-party API fails (Saleor, payment gateway, etc.)
    external: (service: string, originalError: Error, context?: ErrorContext) =>
        new PromcoError(
            ErrorCode.EXTERNAL_SERVICE_ERROR,
            `External service error: ${service}`,
            502,
            { ...context, service, originalError: originalError.message }
        ),
    database: (operation: string, originalError: Error, context?: ErrorContext) =>
        new PromcoError(
            ErrorCode.DATABASE_ERROR,
            `Database operation failed: ${operation}`,
            500,
            { ...context, operation, originalError: originalError.message }
        ),
    rateLimit: (message: string = 'Too many requests', context?: ErrorContext) =>
        new PromcoError(
            ErrorCode.RATE_LIMIT_EXCEEDED,
            message,
            429,
            context
        ),
    timeout: (operation: string, context?: ErrorContext) =>
        new PromcoError(
            ErrorCode.TIMEOUT_ERROR,
            `Operation timeout: ${operation}`,
            504,
            { ...context, operation }
        ),
    // fallback for unexpected errors
    internal: (message: string = 'Internal server error', context?: ErrorContext) =>
        new PromcoError(
            ErrorCode.INTERNAL_SERVER_ERROR,
            message,
            500,
            context
        )
};

/**
 * Convert ANY error into a PromcoError
 * 
 * Normalizes:
 * - PromcoError (already normalized)
 * - Standard Error objects
 * - Strings thrown as errors
 * - External service errors
 * - Unknown/undefined errors
 * 
 * NOTE: Database errors should be handled at the DB layer via handleDrizzleError.
 * This is a fallback for errors that escape proper classification.
 */
export function toPromcoError(error: unknown, context?: ErrorContext): PromcoError {
    if (error instanceof PromcoError) {
        return error;
    }

    // Standard Error object - classify by message pattern
    if (error instanceof Error) {
        // Auth errors
        if (error.message.toLowerCase().includes('unauthorized') ||
            error.message.toLowerCase().includes('not authenticated')) {
            return createError.unauthorized(
                error.message,
                context
            );
        }

        if (error.message.toLowerCase().includes('forbidden') ||
            error.message.toLowerCase().includes('insufficient permissions')) {
            return createError.forbidden(
                error.message,
                context
            );
        }

        // Validation errors
        if (error.message.includes('validation') ||
            error.message.includes('invalid')) {
            return createError.validation(
                error.message,
                undefined,
                context
            );
        }

        // Network/External service errors
        if (error.message.includes('ECONNREFUSED') ||
            error.message.includes('ETIMEDOUT') ||
            error.message.includes('ENOTFOUND')) {
            return createError.external(
                'External Service',
                error,
                context
            );
        }

        // Generic error - preserve original message
        return new PromcoError(
            ErrorCode.INTERNAL_SERVER_ERROR,
            error.message,
            500,
            { ...context, originalStack: error.stack },
            true
        );
    }

    // String thrown as error
    if (typeof error === 'string') {
        return new PromcoError(
            ErrorCode.INTERNAL_SERVER_ERROR,
            error,
            500,
            context,
            true
        );
    }

    // Object with error-like shape (e.g., API response)
    if (typeof error === 'object' && error !== null) {
        const errorObj = error as any;

        if (errorObj.message) {
            return new PromcoError(
                ErrorCode.INTERNAL_SERVER_ERROR,
                errorObj.message,
                errorObj.statusCode || errorObj.status || 500,
                { ...context, ...errorObj },
                true
            );
        }
    }

    // Completely unknown error - convert to string
    return new PromcoError(
        ErrorCode.INTERNAL_SERVER_ERROR,
        String(error),
        500,
        context,
        false // Non-operational - we don't know what this is
    );
}

export const errorLogger = {
    // + enrich with OTEL
    logError: (
        error: PromcoError | Error,
        operation: string,
        additionalContext?: Record<string, any>
    ) => {
        const span = trace.getActiveSpan();
        const promcoError = error instanceof PromcoError
            ? error
            : toPromcoError(error);

        const logContext = {
            'error.code': promcoError.code,
            'error.statusCode': promcoError.statusCode,
            'error.operation': operation,
            'error.isOperational': promcoError.isOperational,
            'error.context': JSON.stringify(promcoError.context),
            ...additionalContext
        };

        if (span) {
            span.setAttributes({
                'error.code': promcoError.code,
                'error.statusCode': promcoError.statusCode,
                'error.operation': operation,
                'error.isOperational': promcoError.isOperational
            });

            span.addEvent("error.detailed", {
                "error.message": promcoError.message,
                "error.stack": promcoError.stack,
                timestamp: Date.now(),
                ...logContext
            });
        } else {
            // if no span exists
            console.error(`[ERROR] ${operation}:`, promcoError.toJSON());
        }
    }
};
