import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { createError, type PromcoError, toPromcoError } from "@repo/utils";
import { GraphQLClient } from "graphql-request";
import type { SaleorContext, SaleorGraphQLError } from "../types";

const client = new GraphQLClient(process.env.SALEOR_API_URL || "", {
	headers: {
		Authorization: `Bearer ${process.env.SALEOR_APP_TOKEN || ""}`,
		"Content-Type": "application/json",
	},
});

/**
 * Execute a Saleor GraphQL query
 *
 * Use this for read operations (queries)
 *
 * @throws {PromcoError} Always throws PromcoError on failure
 */
export async function executeQuery<
	TData,
	TVariables extends Record<string, any> = Record<string, any>,
>(
	document: TypedDocumentNode<TData, TVariables> | string,
	variables: TVariables,
	context: SaleorContext,
): Promise<TData> {
	return executeSaleorRequest(document, variables, context);
}

/**
 * Execute a Saleor GraphQL mutation
 *
 * Use this for write operations (mutations)
 *
 * @throws {PromcoError} Always throws PromcoError on failure
 */
export async function executeMutation<
	TData,
	TVariables extends Record<string, any> = Record<string, any>,
>(
	document: TypedDocumentNode<TData, TVariables> | string,
	variables: TVariables,
	context: SaleorContext,
): Promise<TData> {
	return executeSaleorRequest(document, variables, context);
}

/**
 * Execute a Saleor GraphQL request with error normalization
 *
 * This is the ONLY place where Saleor API calls happen.
 * All errors are normalized to PromcoError before escaping.
 *
 * @throws {PromcoError} Always throws PromcoError on failure
 */
export async function executeSaleorRequest<
	TData,
	TVariables extends Record<string, any> = Record<string, any>,
>(
	document: TypedDocumentNode<TData, TVariables> | string,
	variables: TVariables,
	context: SaleorContext,
): Promise<TData> {
	try {
		// Validate client is configured
		if (!process.env.SALEOR_API_URL || !process.env.SALEOR_APP_TOKEN) {
			throw createError.internal(
				"Saleor client not configured. Missing SALEOR_API_URL or SALEOR_APP_TOKEN",
				{
					organizationId: context.organizationId,
				},
			);
		}

		// Execute GraphQL request
		const data = await client.request<TData, TVariables>(document, variables);

		return data;
	} catch (error: unknown) {
		// Normalize all errors to PromcoError
		throw normalizeSaleorError(error, context);
	}
}

/**
 * Convert Saleor errors to PromcoError
 *
 * Handles:
 * - GraphQL errors (validation, not found, etc.)
 * - Network errors (timeout, connection refused)
 * - Rate limit errors
 * - Unknown errors
 */
function normalizeSaleorError(
	error: unknown,
	context: SaleorContext,
): PromcoError {
	// Already a PromcoError? Pass through
	if (
		error &&
		typeof error === "object" &&
		"code" in error &&
		"statusCode" in error
	) {
		return error as PromcoError;
	}

	// GraphQL Client error with response
	if (error && typeof error === "object" && "response" in error) {
		const gqlError = error as any;
		const errors: SaleorGraphQLError[] = gqlError.response?.errors || [];

		if (errors.length > 0) {
			const firstError = errors[0];

			// ✅ Fixed: Check if firstError exists
			if (!firstError) {
				return createError.external(
					"Saleor",
					new Error("Unknown GraphQL error"),
					{
						channelSlug: context.channelSlug,
						organizationId: context.organizationId,
					},
				);
			}

			// Check for rate limiting
			if (firstError.extensions?.code === "RATE_LIMIT") {
				return createError.rateLimit("Saleor API rate limit exceeded", {
					channelSlug: context.channelSlug,
					organizationId: context.organizationId,
					saleorErrors: errors,
				});
			}

			// Check for authentication errors
			if (
				firstError.message?.toLowerCase().includes("unauthorized") ||
				firstError.message?.toLowerCase().includes("unauthenticated")
			) {
				return createError.unauthorized("Saleor API authentication failed", {
					channelSlug: context.channelSlug,
					organizationId: context.organizationId,
					originalError: firstError.message,
				});
			}

			// Check for not found errors
			if (firstError.message?.toLowerCase().includes("not found")) {
				return createError.notFound("Saleor Resource", {
					channelSlug: context.channelSlug,
					organizationId: context.organizationId,
					saleorErrors: errors,
				});
			}

			// Generic Saleor error
			return createError.external("Saleor", new Error(firstError.message), {
				channelSlug: context.channelSlug,
				organizationId: context.organizationId,
				saleorErrors: errors,
				field: firstError.field,
				code: firstError.code,
			});
		}
	}

	// Network errors
	if (error && typeof error === "object" && "code" in error) {
		const netError = error as any;

		// Timeout
		if (netError.code === "ETIMEDOUT" || netError.code === "ESOCKETTIMEDOUT") {
			return createError.timeout("Saleor API", {
				channelSlug: context.channelSlug,
				organizationId: context.organizationId,
			});
		}

		// Connection refused
		if (netError.code === "ECONNREFUSED" || netError.code === "ENOTFOUND") {
			return createError.external(
				"Saleor",
				new Error("Saleor API unavailable"),
				{
					channelSlug: context.channelSlug,
					organizationId: context.organizationId,
					originalError: netError.message,
				},
			);
		}
	}

	// Fallback: Use generic error normalization
	return toPromcoError(error, {
		service: "Saleor",
		channelSlug: context.channelSlug,
		organizationId: context.organizationId,
	});
}

/**
 * Export the client for advanced use cases
 * (e.g., custom queries not in generated SDK)
 */
export { client as saleorClient };
