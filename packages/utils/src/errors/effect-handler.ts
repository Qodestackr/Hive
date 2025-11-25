import { Effect, Cause } from "effect"
import { trace } from "@opentelemetry/api"
import { PromcoError, ErrorCode } from "./error"
import { isDomainError, type DomainErrorBase } from "./domain/base"

/**
 * Convert Effect domain error to PromcoError for RFC 7807 response
 * 
 * This is the bridge between Effect's typed errors and existing
 * RFC 7807 response infrastructure.
 */
export const effectErrorToPromcoError = (error: unknown): PromcoError => {
    // Domain errors: convert with full context
    if (isDomainError(error)) {
        const context: Record<string, any> = { errorType: error._tag }

        // Extract all enumerable properties for context
        for (const [key, value] of Object.entries(error)) {
            if (
                key !== "_tag" &&
                key !== "errorCode" &&
                key !== "statusCode" &&
                key !== "message" &&
                value !== undefined
            ) {
                context[key] = value
            }
        }

        return new PromcoError(
            error.errorCode,
            error.message,
            error.statusCode,
            context
        )
    }

    // Fallback for unknown errors
    if (error instanceof Error) {
        return new PromcoError(
            ErrorCode.INTERNAL_SERVER_ERROR,
            error.message,
            500,
            { originalError: error.message, stack: error.stack }
        )
    }

    return new PromcoError(
        ErrorCode.INTERNAL_SERVER_ERROR,
        String(error),
        500
    )
}

/**
 * Run Effect and convert to Response (for API routes)
 * 
 * This is your Effect → HTTP bridge. Use in API routes to handle
 * Effect-based services cleanly.
 * 
 * @example
 * ```typescript
 * export async function GET(req: Request) {
 *   return runEffectAsResponse(
 *     myEffectService.doSomething(params)
 *   )
 * }
 * ```
 */
export const runEffectAsResponse = async <A, E>(
    effect: Effect.Effect<A, E, never>
): Promise<Response> => {
    const result = await Effect.runPromiseExit(effect)

    // Success path
    if (result._tag === "Success") {
        return Response.json({ success: true, data: result.value })
    }

    // Error path - extract from Cause
    const failureOption = Cause.failureOption(result.cause)

    if (failureOption._tag === "Some") {
        const error = failureOption.value
        const promcoError = effectErrorToPromcoError(error)
        const span = trace.getActiveSpan()

        // Attach to OTEL span
        if (span) {
            span.setAttributes({
                "error.code": promcoError.code,
                "error.statusCode": promcoError.statusCode,
                "error.isOperational": promcoError.isOperational
            })

            if (isDomainError(error)) {
                span.setAttributes({
                    "error.type": error._tag
                })
            }
        }

        // RFC 7807 response
        return Response.json(
            {
                type: `error/${promcoError.code}`,
                title: promcoError.code,
                status: promcoError.statusCode,
                detail: promcoError.message,
                ...promcoError.context
            },
            {
                status: promcoError.statusCode,
                headers: {
                    "Content-Type": "application/problem+json",
                    "X-Error-Code": promcoError.code
                }
            }
        )
    }

    // Defect or other errors - log and return 500
    console.error("[EFFECT_ERROR]", Cause.pretty(result.cause))

    return Response.json(
        {
            type: "error/INTERNAL_SERVER_ERROR",
            title: "Internal Server Error",
            status: 500,
            detail: "An unexpected error occurred"
        },
        {
            status: 500,
            headers: { "Content-Type": "application/problem+json" }
        }
    )
}

/**
 * Catch database errors and convert to typed Effect errors
 * 
 * Wraps database operations to convert raw errors into typed domain errors.
 * 
 * @example
 * ```typescript
 * const user = yield* catchDatabaseError(
 *   "findUser",
 *   () => db.select().from(users).where(eq(users.id, id)),
 *   (error) => new UserNotFound({ userId: id })
 * )
 * ```
 */
export const catchDatabaseError = <A, E>(
    operation: string,
    fn: () => Promise<A>,
    onError: (error: unknown) => E
): Effect.Effect<A, E> => {
    return Effect.tryPromise({
        try: fn,
        catch: onError
    })
}
