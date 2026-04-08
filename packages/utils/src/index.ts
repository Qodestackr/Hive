import * as baseZod from "zod";

export { context, SpanKind, trace } from "@opentelemetry/api";
export * from "./config/config";
export * from "./config/urls";
export * from "./functions/date";
export { generateId } from "./functions/generate-id";
export { tryCatch } from "./functions/try-catch";
// Export idempotency primitives
export * from "./idempotency";
export {
	cacheTrace,
	dbTrace,
	logger,
	toError,
	traceSpan,
} from "./telemetry/telemetry";

export { baseZod as z };
export type { ZodRawShape, ZodTypeAny } from "zod";

export { default as env } from "./config/env";
export * from "./context";
export { OrganizationContext } from "./context";
export * from "./errors/domain";
export type {
	CommonDbIssue,
	DatabaseConnectionIssue,
	// db error types
	DatabaseConstraintError,
	DatabaseError,
	DatabaseSchemaError,
	DomainErrorBase,
	PromoCodeError,
} from "./errors/domain/index";
export {
	CheckConstraintViolation,
	DatabaseConnectionError,
	DatabaseQueryTimeout,
	EffectValidationError,
	ForeignKeyViolation,
	GenericDatabaseError,
	DatabaseQueryError,
	GenericDbError,
	GenericDbTimeout,
	isDomainError,
	NotNullViolation,
	PromoCodeAlreadyRedeemed,
	PromoCodeExpired,
	PromoCodeNoProduct,
	PromoCodeNotFound,
	UndefinedColumn,
	UndefinedTable,
	// Database errors
	UniqueConstraintViolation,
} from "./errors/domain/index";
export * from "./errors/effect-handler";
export {
	catchDatabaseError,
	effectErrorToPromcoError,
	runEffectAsResponse,
} from "./errors/effect-handler";
// Export all utilities
export * from "./errors/error";
// Also provide named exports for common items
export { createError } from "./errors/error";
export * from "./errors/error-handler";
export { ErrorHandler } from "./errors/error-handler";
export * from "./errors/with-error-trace";

export * from "./functions/url";
