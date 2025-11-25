/**
 * Promise-based Drizzle Error Handler
 * 
 * Converts raw PostgreSQL errors into typed PromcoError exceptions (throw/catch pattern).
 * 
 * **When to use this:**
 * - Simple CRUD operations where Effect overhead isn't justified
 * - Existing Promise-based code that doesn't need error composition
 * - Quick scripts, migrations, or utilities
 * 
 * **When to use Effect version instead:**
 * - Complex error composition (redemption, multi-step transactions)
 * - Need type-safe error handling in function signature
 * - Building workflows where errors are data, not exceptions
 */
import { createError, type ErrorContext } from "@repo/utils"

const PG_ERROR_CODES = {
    UNIQUE_VIOLATION: '23505',
    FOREIGN_KEY_VIOLATION: '23503',
    NOT_NULL_VIOLATION: '23502',
    CHECK_VIOLATION: '23514',
    UNDEFINED_TABLE: '42P01',
    UNDEFINED_COLUMN: '42703',
    CONNECTION_FAILURE: '08000',
    QUERY_CANCELED: '57014',
} as const

/**
 * Extract field name from PostgreSQL error detail
 */
function extractFieldFromDetail(detail?: string): string | undefined {
    if (!detail) return undefined
    const match = detail.match(/Key \(([^)]+)\)/)
    return match?.[1]
}

/**
 * Extract field name from not-null violation message
 */
function extractFieldFromNotNull(message: string): string | undefined {
    const match = message.match(/column "([^"]+)"/)
    return match?.[1]
}

/**
 * Classify and throw typed PromcoError based on PostgreSQL error code
 * 
 * This throws a PromcoError and NEVER returns (return type: never).
 * 
 * @param error - Raw error from Drizzle/PostgreSQL
 * @param context - Additional context (table, operation, custom data)
 * @throws PromcoError with appropriate status code and type
 */
export function handleDrizzleError(
    error: any,
    context: ErrorContext = {}
): never {
    const pgCode = error.code
    const message = error.message || String(error)
    const detail = error.detail
    const table = error.table || context.table
    const constraint = error.constraint

    // Unique Constraint → 409 Conflict
    if (pgCode === PG_ERROR_CODES.UNIQUE_VIOLATION) {
        const field = extractFieldFromDetail(detail)

        throw createError.conflict(
            `Duplicate entry for ${field || 'field'}`,
            {
                ...context,
                field,
                table,
                constraint,
                detail,
                pgCode,
            }
        )
    }

    // Foreign Key Violation → 400 Validation
    if (pgCode === PG_ERROR_CODES.FOREIGN_KEY_VIOLATION) {
        const field = extractFieldFromDetail(detail)

        throw createError.validation(
            `Referenced resource does not exist`,
            field,
            {
                ...context,
                table,
                constraint,
                detail,
                pgCode,
            }
        )
    }

    // Not Null Violation → 400 Validation
    if (pgCode === PG_ERROR_CODES.NOT_NULL_VIOLATION) {
        const field = extractFieldFromNotNull(message)

        throw createError.validation(
            `${field || 'Field'} cannot be null`,
            field,
            {
                ...context,
                table,
                constraint,
                pgCode,
            }
        )
    }

    // Check Constraint Violation → 400 Validation
    if (pgCode === PG_ERROR_CODES.CHECK_VIOLATION) {
        const field = extractFieldFromDetail(detail)

        throw createError.validation(
            `Value violates check constraint`,
            field,
            {
                ...context,
                table,
                constraint,
                detail,
                pgCode,
            }
        )
    }

    // SCHEMA/QUERY ERRORS (Developer Mistakes)
    if (pgCode === PG_ERROR_CODES.UNDEFINED_TABLE) {
        throw createError.database(
            'query',
            new Error(`Table does not exist: ${message}`),
            {
                ...context,
                pgCode,
                detail: message,
            }
        )
    }

    if (pgCode === PG_ERROR_CODES.UNDEFINED_COLUMN) {
        throw createError.database(
            'query',
            new Error(`Column does not exist: ${message}`),
            {
                ...context,
                pgCode,
                detail: message,
            }
        )
    }


    // CONNECTION/TIMEOUT ERRORS
    if (pgCode === PG_ERROR_CODES.CONNECTION_FAILURE) {
        throw createError.database(
            'connection',
            new Error('Database connection failed'),
            {
                ...context,
                pgCode,
                detail: message,
            }
        )
    }

    if (pgCode === PG_ERROR_CODES.QUERY_CANCELED) {
        throw createError.timeout(
            context.operation || 'database query',
            {
                ...context,
                pgCode,
                detail: message,
            }
        )
    }


    // FALLBACK: GENERIC DATABASE ERROR
    throw createError.database(
        context.operation || 'query',
        error instanceof Error ? error : new Error(message),
        {
            ...context,
            pgCode,
            detail,
            table,
            constraint,
        }
    )
}
