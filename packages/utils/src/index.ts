
import * as baseZod from "zod";

export { traceSpan, logger, dbTrace, cacheTrace, toError } from './telemetry/telemetry';
export { generateId } from './functions/generate-id';
export * from './functions/date';
export { tryCatch } from './functions/try-catch';

// Export idempotency primitives
export * from './idempotency';

export { SpanKind, trace, context } from "@opentelemetry/api";

export * from './config/config';
export * from './config/urls';

export { baseZod as z };
export { type ZodRawShape, type ZodTypeAny } from "zod";

export { default as env } from './config/env';

// Export all utilities
export * from './errors/error';
export * from './errors/error-handler';
export * from './errors/effect-handler';
export * from './errors/domain';
export * from './context';

// Also provide named exports for common items
export { createError } from './errors/error';
export { ErrorHandler } from './errors/error-handler';
export { effectErrorToPromcoError, runEffectAsResponse, catchDatabaseError } from './errors/effect-handler';
export { OrganizationContext } from './context';
export {
  isDomainError,
  EffectValidationError,
  GenericDbError, GenericDbTimeout,
  OrganizationNotFound, NotAMember,
  PromoCodeNotFound, PromoCodeAlreadyRedeemed, PromoCodeExpired, PromoCodeNoProduct,
  // Database errors
  UniqueConstraintViolation,
  ForeignKeyViolation,
  NotNullViolation,
  CheckConstraintViolation,
  UndefinedTable,
  UndefinedColumn,
  DatabaseConnectionError,
  DatabaseQueryTimeout,
  GenericDatabaseError
} from './errors/domain/index';
export type {
  DomainErrorBase,
  CommonDbIssue, OrganizationError, PromoCodeError,
  // Database error types
  DatabaseConstraintError,
  DatabaseSchemaError,
  DatabaseConnectionIssue,
  DatabaseError
} from './errors/domain/index';
