/**
 * Drizzle Error Handler for Effect
 * 
 * Converts raw PostgreSQL errors from Drizzle into typed Effect domain errors.
 */
import { Effect } from "effect"
import type { ErrorContext } from "@repo/utils"
import {
    UniqueConstraintViolation,
    ForeignKeyViolation,
    NotNullViolation,
    CheckConstraintViolation,
    UndefinedTable,
    UndefinedColumn,
    DatabaseConnectionError,
    DatabaseQueryTimeout,
    GenericDatabaseError,
    type DatabaseError
} from "@repo/utils"

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
 * 
 * Examples:
 * - "Key (email)=(test@example.com) already exists." → "email"
 * - "Key (user_id)=(123) is not present in table users." → "user_id"
 */
function extractFieldFromDetail(detail?: string): string | undefined {
    if (!detail) return undefined

    const match = detail.match(/Key \(([^)]+)\)/)
    return match?.[1]
}

/**
 * Extract field name from not-null violation message
 * 
 * Example:
 * - 'null value in column "email" violates not-null constraint' → "email"
 */
function extractFieldFromNotNull(message: string): string | undefined {
    const match = message.match(/column "([^"]+)"/)
    return match?.[1]
}

/**
 * Handle Drizzle/PostgreSQL errors and convert to typed Effect errors
 * 
 * This is the main function that classifies database errors based on PostgreSQL
 * error codes and returns appropriate Effect errors.
 * 
 * @param error - Raw error from Drizzle/PostgreSQL
 * @param context - Additional context (table, operation, etc.)
 * @returns Effect that fails with typed database error
 */
export function handleDrizzleError(
    error: any,
    context: ErrorContext = {}
): Effect.Effect<never, DatabaseError, never> {
    const pgCode = error.code
    const message = error.message || String(error)
    const detail = error.detail
    const table = error.table || context.table
    const constraint = error.constraint

    // Unique Constraint → 409 Conflict
    if (pgCode === PG_ERROR_CODES.UNIQUE_VIOLATION) {
        const field = extractFieldFromDetail(detail)

        return Effect.fail(
            new UniqueConstraintViolation({
                field,
                table: String(table),
                constraint,
                detail,
                pgCode
            })
        )
    }

    // Foreign Key Violation → 400 Validation
    if (pgCode === PG_ERROR_CODES.FOREIGN_KEY_VIOLATION) {
        const field = extractFieldFromDetail(detail)

        return Effect.fail(
            new ForeignKeyViolation({
                field,
                table: String(table),
                constraint,
                detail,
                pgCode
            })
        )
    }

    // Not Null Violation → 400 Validation
    if (pgCode === PG_ERROR_CODES.NOT_NULL_VIOLATION) {
        const field = extractFieldFromNotNull(message)

        return Effect.fail(
            new NotNullViolation({
                field,
                table: String(table),
                pgCode
            })
        )
    }

    // Check Constraint Violation → 400 Validation
    if (pgCode === PG_ERROR_CODES.CHECK_VIOLATION) {
        const field = extractFieldFromDetail(detail)

        return Effect.fail(
            new CheckConstraintViolation({
                field,
                table: String(table),
                constraint,
                detail,
                pgCode
            })
        )
    }

    // SCHEMA/QUERY ERRORS (Developer Mistakes)
    if (pgCode === PG_ERROR_CODES.UNDEFINED_TABLE) {
        return Effect.fail(
            new UndefinedTable({
                table: String(table),
                pgCode,
                detail: message
            })
        )
    }

    if (pgCode === PG_ERROR_CODES.UNDEFINED_COLUMN) {
        return Effect.fail(
            new UndefinedColumn({
                column: undefined, // Could extract from message if needed
                pgCode,
                detail: message
            })
        )
    }

    // CONNECTION/TIMEOUT ERRORS
    if (pgCode === PG_ERROR_CODES.CONNECTION_FAILURE) {
        return Effect.fail(
            new DatabaseConnectionError({
                operation: String(context.operation || 'unknown'),
                pgCode,
                detail: message
            })
        )
    }

    if (pgCode === PG_ERROR_CODES.QUERY_CANCELED) {
        return Effect.fail(
            new DatabaseQueryTimeout({
                operation: String(context.operation || 'unknown'),
                pgCode,
                detail: message
            })
        )
    }

    // FALLBACK: GENERIC DATABASE ERROR
    return Effect.fail(
        new GenericDatabaseError({
            operation: String(context.operation || 'unknown'),
            table: String(table),
            pgCode,
            detail,
            originalError: error
        })
    )
}

/**
 * Wrap a database operation with Effect error handling
 * 
 * Catches raw Drizzle errors and converts them to typed Effect domain errors.
 * 
 * @example
 * ```typescript
 * const user = yield* withDrizzleErrors(
 *   "users",
 *   "insert",
 *   () => db.insert(users).values({ email }).returning()
 * )
 * ```
 */
export function withDrizzleErrors<A>(
    table: string,
    operation: string,
    query: () => Promise<A>
): Effect.Effect<A, DatabaseError, never> {
    return Effect.tryPromise({
        try: query,
        catch: (error) => {
            // Convert to Effect error via handleDrizzleError
            const errorEffect = handleDrizzleError(error, { table, operation })
            // Extract the error from the Effect
            return Effect.runSync(Effect.flip(errorEffect))
        }
    })
}
