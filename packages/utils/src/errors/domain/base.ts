/**
 * All Effect domain errors extend this to ensure compatibility with RFC 7807
 * and existing PromcoError infrastructure.
 */
import type { ErrorCode } from "../error";

export interface DomainErrorBase {
	readonly _tag: string;
	readonly errorCode: ErrorCode;
	readonly statusCode: number;
	readonly message: string;
}

export const isDomainError = (error: unknown): error is DomainErrorBase => {
	return (
		error !== null &&
		typeof error === "object" &&
		"_tag" in error &&
		"errorCode" in error &&
		"statusCode" in error &&
		"message" in error
	);
};
