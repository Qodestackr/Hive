import type { Session } from "@repo/auth";
import type { ErrorContext } from "@repo/utils";
import { createError, withApiTrace } from "@repo/utils";
import { handleApiError } from "@repo/utils/errors/error-handler";
import type { NextRequest } from "next/server";
import { getSafeSession } from "@/utils/auth-utils";
import {
	type WithWorkspaceOptions,
	type WorkspaceHandler,
	withWorkspaceContext,
} from "./with-workspace-context";

export interface EnhancedApiOptions extends WithWorkspaceOptions {
	operationName: string;
	errorContext?: ErrorContext;
	requireWorkspace?: boolean;
}

export type SimpleApiHandler = (params: {
	req: NextRequest;
	params: Record<string, string>;
	searchParams: Record<string, string>;
	headers: Record<string, string>;
	session: Session | null;
}) => Promise<Response>;

/**
 * Overload #1: workspace‐aware (default when requireWorkspace=true or omitted)
 *   — returns a function whose args & return exactly match the handler `H`
 */
export function withEnhancedApiContext<H extends WorkspaceHandler>(
	handler: H,
	options: EnhancedApiOptions & { requireWorkspace?: true },
): (...args: Parameters<H>) => ReturnType<H>;

/**
 * Overload #2: simple (requireWorkspace=false)
 */
export function withEnhancedApiContext<H extends SimpleApiHandler>(
	handler: H,
	options: EnhancedApiOptions & { requireWorkspace: false },
): (...args: Parameters<H>) => ReturnType<H>;

export function withEnhancedApiContext(
	handler: WorkspaceHandler | SimpleApiHandler,
	options: EnhancedApiOptions,
) {
	if (options.requireWorkspace === false) {
		return withSimpleApiContext(handler as SimpleApiHandler, options);
	}

	const workspaceHandler = withWorkspaceContext(
		handler as WorkspaceHandler,
		options,
	);
	const tracedHandler = withApiTrace(
		options.operationName,
		workspaceHandler,
		options.errorContext,
	);

	return async (
		req: NextRequest,
		context: { params: Record<string, string> },
	) => {
		try {
			return await tracedHandler(req, context);
		} catch (error) {
			return handleApiError(error, options.operationName, {
				...options.errorContext,
				url: req.url,
				method: req.method,
				params: context.params,
			});
		}
	};
}

function withSimpleApiContext(
	handler: SimpleApiHandler,
	options: EnhancedApiOptions,
) {
	const tracedHandler = withApiTrace(
		options.operationName,
		async (req: NextRequest, context: { params: Record<string, string> }) => {
			const searchParams = Object.fromEntries(new URL(req.url).searchParams);
			const headers: Record<string, string> = {};

			// Get session (but don't require it unless specified)
			let session: Session | null = null;
			try {
				const sessionResult = await getSafeSession();
				session = sessionResult.session! as unknown as Session;
			} catch (error) {
				// If session is required but fails, throw error
				if (options.skipPermissionChecks !== true) {
					throw createError.unauthorized("Unauthorized: Login required.", {
						url: req.url,
					});
				}
				// Otherwise, continue with null session for public endpoints
			}

			// Call the simple handler with properly typed parameters
			return await handler({
				req,
				params: context.params,
				searchParams,
				headers,
				session,
			});
		},
		options.errorContext,
	);

	return async (
		req: NextRequest,
		context: { params: Record<string, string> },
	) => {
		try {
			return await tracedHandler(req, context);
		} catch (error) {
			return handleApiError(error, options.operationName, {
				...options.errorContext,
				url: req.url,
				method: req.method,
				params: context.params,
			});
		}
	};
}
