import { type Span, SpanStatusCode, trace } from "@opentelemetry/api";
import {
	ErrorCode,
	type ErrorContext,
	type PromcoError,
	toPromcoError,
} from "./error";

export interface ErrorHandlerOptions {
	operation: string;
	context?: ErrorContext;
	span?: Span;
	includeStack?: boolean;
	logLevel?: "error" | "warn" | "info";
}

export class ErrorHandler {
	private static instance: ErrorHandler;

	static getInstance(): ErrorHandler {
		if (!ErrorHandler.instance) {
			ErrorHandler.instance = new ErrorHandler();
		}
		return ErrorHandler.instance;
	}

	handleError(error: unknown, options: ErrorHandlerOptions): PromcoError {
		const { operation, context = {}, span, includeStack = false } = options;

		const promcoError = toPromcoError(error, {
			...context,
			operation,
			timestamp: new Date().toISOString(),
			traceId: span?.spanContext().traceId,
			spanId: span?.spanContext().spanId,
		});

		// Add error details to active span
		const activeSpan = span || trace.getActiveSpan();
		if (activeSpan) {
			this.addErrorToSpan(activeSpan, promcoError, operation);
		}

		this.logStructuredError(promcoError, operation, includeStack);

		return promcoError;
	}

	/**
	 * RFC 7807 compliant API error handler
	 */
	handleApiError(
		error: unknown,
		operation: string,
		context?: ErrorContext,
	): Response {
		const promcoError = this.handleError(error, {
			operation,
			context,
			includeStack: process.env.NODE_ENV === "development",
		});

		const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.promco.com";
		const traceId = context?.traceId || this.generateTraceId();

		// RFC 7807 Problem Details format
		const problemDetails: Record<string, any> = {
			type: `${baseUrl}/errors/${this.getErrorType(promcoError.code)}`,
			title: this.getErrorTitle(promcoError.code),
			status: promcoError.statusCode,
			detail: promcoError.message,
			instance: context?.url || "/unknown",
			traceId,
		};

		// Add context fields (field, resource, rule, etc.)
		if (promcoError.context) {
			Object.keys(promcoError.context).forEach((key) => {
				// Skip internal fields
				if (
					![
						"operation",
						"timestamp",
						"traceId",
						"spanId",
						"url",
						"method",
						"params",
					].includes(key)
				) {
					problemDetails[key] = promcoError.context[key];
				}
			});
		}

		// Add stack trace in dev
		if (process.env.NODE_ENV === "development" && promcoError.stack) {
			problemDetails.stack = promcoError.stack;
		}

		return Response.json(problemDetails, {
			status: promcoError.statusCode,
			headers: {
				"Content-Type": "application/problem+json",
				"X-Error-Code": promcoError.code,
				"X-Trace-ID": traceId,
			},
		});
	}

	private getErrorType(code: ErrorCode): string {
		const typeMap: Record<ErrorCode, string> = {
			[ErrorCode.VALIDATION_ERROR]: "validation-error",
			[ErrorCode.MISSING_REQUIRED_FIELD]: "validation-error",
			[ErrorCode.INVALID_FORMAT]: "validation-error",
			[ErrorCode.UNAUTHORIZED]: "unauthorized",
			[ErrorCode.FORBIDDEN]: "forbidden",
			[ErrorCode.TOKEN_EXPIRED]: "token-expired",
			[ErrorCode.EXTERNAL_SERVICE_ERROR]: "external-service-error",
			[ErrorCode.TIMEOUT_ERROR]: "timeout-error",
			[ErrorCode.RATE_LIMIT_EXCEEDED]: "rate-limit-exceeded",
			[ErrorCode.DATABASE_ERROR]: "database-error",
			[ErrorCode.RECORD_NOT_FOUND]: "not-found",
			[ErrorCode.DUPLICATE_RECORD]: "conflict",
			[ErrorCode.INSUFFICIENT_FUNDS]: "insufficient-funds",
			[ErrorCode.BUSINESS_RULE_VIOLATION]: "business-rule-violation",
			[ErrorCode.INTERNAL_SERVER_ERROR]: "internal-error",
			[ErrorCode.CONFIGURATION_ERROR]: "configuration-error",
		};

		return typeMap[code] || "internal-error";
	}

	private getErrorTitle(code: ErrorCode): string {
		const titleMap: Record<ErrorCode, string> = {
			[ErrorCode.VALIDATION_ERROR]: "Validation Failed",
			[ErrorCode.MISSING_REQUIRED_FIELD]: "Missing Required Field",
			[ErrorCode.INVALID_FORMAT]: "Invalid Format",
			[ErrorCode.UNAUTHORIZED]: "Authentication Required",
			[ErrorCode.FORBIDDEN]: "Access Forbidden",
			[ErrorCode.TOKEN_EXPIRED]: "Token Expired",
			[ErrorCode.EXTERNAL_SERVICE_ERROR]: "External Service Error",
			[ErrorCode.TIMEOUT_ERROR]: "Request Timeout",
			[ErrorCode.RATE_LIMIT_EXCEEDED]: "Rate Limit Exceeded",
			[ErrorCode.DATABASE_ERROR]: "Database Error",
			[ErrorCode.RECORD_NOT_FOUND]: "Resource Not Found",
			[ErrorCode.DUPLICATE_RECORD]: "Resource Conflict",
			[ErrorCode.INSUFFICIENT_FUNDS]: "Insufficient Funds",
			[ErrorCode.BUSINESS_RULE_VIOLATION]: "Business Rule Violation",
			[ErrorCode.INTERNAL_SERVER_ERROR]: "Internal Server Error",
			[ErrorCode.CONFIGURATION_ERROR]: "Configuration Error",
		};

		return titleMap[code] || "Internal Server Error";
	}

	private generateTraceId(): string {
		return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	private addErrorToSpan(
		span: Span,
		error: PromcoError,
		operation: string,
	): void {
		span.setStatus({
			code: SpanStatusCode.ERROR,
			message: error.message,
		});

		span.setAttributes({
			"error.type": error.name,
			"error.code": error.code,
			"error.message": error.message,
			"error.operation": operation,
			"error.statusCode": error.statusCode,
			"error.isOperational": error.isOperational,
			"error.timestamp": error.timestamp.toISOString(),
		});

		span.addEvent("error.occurred", {
			"error.code": error.code,
			"error.message": error.message,
			"error.context": JSON.stringify(error.context),
			"error.stack": error.stack || "No stack trace available",
			timestamp: Date.now(),
		});
	}

	private logStructuredError(
		error: PromcoError,
		operation: string,
		includeStack: boolean,
	): void {
		const logData = {
			level: this.getLogLevel(error.statusCode),
			operation,
			error: {
				code: error.code,
				message: error.message,
				statusCode: error.statusCode,
				isOperational: error.isOperational,
				context: error.context,
				timestamp: error.timestamp.toISOString(),
				...(includeStack && { stack: error.stack }),
			},
		};

		// Log to console (TODO: Replace with proper logging service)
		if (error.statusCode >= 500) {
			console.error(
				`[PROMCO:ERROR] ${operation}:`,
				JSON.stringify(logData, null, 2),
			);
		} else if (error.statusCode >= 400) {
			console.warn(
				`[PROMCO:WARN] ${operation}:`,
				JSON.stringify(logData, null, 2),
			);
		} else {
			console.info(
				`[PROMCO:INFO] ${operation}:`,
				JSON.stringify(logData, null, 2),
			);
		}
	}

	private getLogLevel(statusCode: number): string {
		if (statusCode >= 500) return "error";
		if (statusCode >= 400) return "warn";
		return "info";
	}
}

export const errorHandler = ErrorHandler.getInstance();

export function handleApiError(
	error: unknown,
	operation: string,
	context?: ErrorContext,
): Response {
	return errorHandler.handleApiError(error, operation, context);
}

export function handleError(
	error: unknown,
	options: ErrorHandlerOptions,
): PromcoError {
	return errorHandler.handleError(error, options);
}
