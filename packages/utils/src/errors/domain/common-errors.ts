import { Data } from "effect"
import { ErrorCode } from "../error"

// TODO: Validation errors handled by Zod at API layer.
export class EffectValidationError extends Data.TaggedError("EffectValidationError")<{
    readonly field?: string
    readonly constraint: string
    readonly value?: unknown
}> {
    readonly errorCode = ErrorCode.VALIDATION_ERROR
    readonly statusCode = 400

    get message() {
        return this.field
            ? `Validation failed for '${this.field}': ${this.constraint}`
            : `Validation failed: ${this.constraint}`
    }
}

export class GenericDbError extends Data.TaggedError("GenericDbError")<{
    readonly operation: string
    readonly table?: string
    readonly originalError: unknown
}> {
    readonly errorCode = ErrorCode.DATABASE_ERROR
    readonly statusCode = 500

    get message() {
        return `Database operation '${this.operation}' failed${this.table ? ` on table '${this.table}'` : ""}`
    }
}

export class GenericDbTimeout extends Data.TaggedError("GenericDbTimeout")<{
    readonly operation: string
    readonly timeoutMs: number
}> {
    readonly errorCode = ErrorCode.TIMEOUT_ERROR
    readonly statusCode = 504

    get message() {
        return `Database operation '${this.operation}' timed out after ${this.timeoutMs}ms`
    }
}

export type CommonDbIssue = GenericDbError | GenericDbTimeout