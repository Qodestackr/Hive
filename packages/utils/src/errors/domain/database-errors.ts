import { Data } from "effect";
import { ErrorCode } from "../error";

// CONSTRAINT VIOLATION ERRORS
export class UniqueConstraintViolation extends Data.TaggedError(
	"UniqueConstraintViolation",
)<{
	readonly field: string | undefined;
	readonly table: string | undefined;
	readonly constraint: string | undefined;
	readonly detail: string | undefined;
	readonly pgCode: string;
}> {
	readonly errorCode = ErrorCode.DUPLICATE_RECORD;
	readonly statusCode = 409;

	get message() {
		return this.field
			? `Duplicate entry for ${this.field}`
			: "Duplicate entry detected";
	}
}

export class ForeignKeyViolation extends Data.TaggedError(
	"ForeignKeyViolation",
)<{
	readonly field: string | undefined;
	readonly table: string | undefined;
	readonly constraint: string | undefined;
	readonly detail: string | undefined;
	readonly pgCode: string;
	readonly referencedResource?: string;
}> {
	readonly errorCode = ErrorCode.VALIDATION_ERROR;
	readonly statusCode = 400;

	get message() {
		return this.referencedResource
			? `Referenced ${this.referencedResource} does not exist`
			: "Referenced resource does not exist";
	}
}

export class NotNullViolation extends Data.TaggedError("NotNullViolation")<{
	readonly field: string | undefined;
	readonly table: string | undefined;
	readonly pgCode: string;
}> {
	readonly errorCode = ErrorCode.VALIDATION_ERROR;
	readonly statusCode = 400;

	get message() {
		return this.field
			? `${this.field} cannot be null`
			: "Required field cannot be null";
	}
}

export class CheckConstraintViolation extends Data.TaggedError(
	"CheckConstraintViolation",
)<{
	readonly field: string | undefined;
	readonly table: string | undefined;
	readonly constraint: string | undefined;
	readonly detail: string | undefined;
	readonly pgCode: string;
}> {
	readonly errorCode = ErrorCode.VALIDATION_ERROR;
	readonly statusCode = 400;

	get message() {
		return "Value violates check constraint";
	}
}

// SCHEMA/QUERY ERRORS (Dev Mistakes)
export class UndefinedTable extends Data.TaggedError("UndefinedTable")<{
	readonly table: string | undefined;
	readonly pgCode: string;
	readonly detail: string;
}> {
	readonly errorCode = ErrorCode.DATABASE_ERROR;
	readonly statusCode = 500;

	get message() {
		return this.table
			? `Table '${this.table}' does not exist`
			: "Database table does not exist";
	}
}

export class UndefinedColumn extends Data.TaggedError("UndefinedColumn")<{
	readonly column: string | undefined;
	readonly pgCode: string;
	readonly detail: string;
}> {
	readonly errorCode = ErrorCode.DATABASE_ERROR;
	readonly statusCode = 500;

	get message() {
		return this.column
			? `Column '${this.column}' does not exist`
			: "Database column does not exist";
	}
}

// CONNECTION/TIMEOUT ERRORS
export class DatabaseConnectionError extends Data.TaggedError(
	"DatabaseConnectionError",
)<{
	readonly operation: string;
	readonly pgCode: string;
	readonly detail: string;
}> {
	readonly errorCode = ErrorCode.DATABASE_ERROR;
	readonly statusCode = 500;

	get message() {
		return `Database connection failed during ${this.operation}`;
	}
}

export class DatabaseQueryTimeout extends Data.TaggedError(
	"DatabaseQueryTimeout",
)<{
	readonly operation: string;
	readonly pgCode: string;
	readonly detail: string;
}> {
	readonly errorCode = ErrorCode.TIMEOUT_ERROR;
	readonly statusCode = 504;

	get message() {
		return `Database query timed out during ${this.operation}`;
	}
}

// GENERIC DATABASE ERROR
export class GenericDatabaseError extends Data.TaggedError(
	"GenericDatabaseError",
)<{
	readonly operation: string;
	readonly table: string | undefined;
	readonly pgCode: string | undefined;
	readonly detail: string | undefined;
	readonly originalError: unknown;
}> {
	readonly errorCode = ErrorCode.DATABASE_ERROR;
	readonly statusCode = 500;

	get message() {
		return `Database operation '${this.operation}' failed${this.table ? ` on table '${this.table}'` : ""}`;
	}
}

export class DatabaseQueryError extends Data.TaggedError("DatabaseQueryError")<{
	readonly operation: string;
	readonly table: string | undefined;
	readonly pgCode?: string;
	readonly detail?: string;
	readonly originalError: unknown;
}> {
	readonly errorCode = ErrorCode.DATABASE_ERROR;
	readonly statusCode = 500;

	get message() {
		return `Database query failed during '${this.operation}'${this.table ? ` on table '${this.table}'` : ""}`;
	}
}

// Type Unions
export type DatabaseConstraintError =
	| UniqueConstraintViolation
	| ForeignKeyViolation
	| NotNullViolation
	| CheckConstraintViolation;

export type DatabaseSchemaError = UndefinedTable | UndefinedColumn;

export type DatabaseConnectionIssue =
	| DatabaseConnectionError
	| DatabaseQueryTimeout;

export type DatabaseError =
	| DatabaseConstraintError
	| DatabaseSchemaError
	| DatabaseConnectionIssue
	| GenericDatabaseError
	| DatabaseQueryError;
