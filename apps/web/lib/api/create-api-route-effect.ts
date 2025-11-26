import type { ZodType } from "@repo/schema";
import { OrganizationContext, runEffectAsResponse } from "@repo/utils";
import { Effect } from "effect";
import {
	type EnhancedApiOptions,
	withEnhancedApiContext,
} from "./with-enhanced-context";
import type { WorkspaceHandlerParams } from "./with-workspace-context";

/**
 * Effect-based Workspace Route Config
 *
 * Like createWorkspaceRoute but handler returns Effect instead of Promise.
 * Errors are typed in the Effect signature, not thrown.
 * OrganizationContext is automatically provided - no prop drilling!
 */
interface WorkspaceRouteEffectConfig<TInput, TOutput, TError> {
	inputSchema?: ZodType<TInput>;
	outputSchema: ZodType<TOutput>;
	handler: (
		data: TInput,
		context: WorkspaceHandlerParams,
	) => Effect.Effect<TOutput, TError, OrganizationContext>;
	options: EnhancedApiOptions & { requireWorkspace?: true };
}

/**
 * Create a workspace-scoped API route that uses Effect error handling
 * - Handler returns Effect instead of Promise
 * - Errors are typed (not thrown)
 * - Automatically converts Effect errors to RFC 7807 responses
 * - Automatically provides OrganizationContext - no prop drilling!
 *
 * @example
 * ```typescript
 * export const POST = createWorkspaceRouteEffect({
 *   inputSchema: PromoCodeRedeemSchema,
 *   outputSchema: PromoCodeRedemptionResponseSchema,
 *
 *   handler: (data) =>
 *     promoCodeService.redeemPromoCodeEffect(data),
 *   // organizationId comes from context automatically!
 *
 *   options: {
 *     operationName: "redeemPromoCode",
 *     requiredPermissions: ["promo_codes.redeem"]
 *   }
 * })
 * ```
 */
export function createWorkspaceRouteEffect<TInput, TOutput, TError>(
	config: WorkspaceRouteEffectConfig<TInput, TOutput, TError>,
) {
	// Wrap the Effect handler to integrate with existing API infrastructure
	const wrappedHandler = async (context: WorkspaceHandlerParams) => {
		let inputData: TInput;

		// INPUT VALIDATION (same as createWorkspaceRoute)
		if (config.inputSchema) {
			if (context.req.method === "GET") {
				const query = Object.fromEntries(
					context.req.nextUrl.searchParams.entries(),
				);
				inputData = config.inputSchema.parse(query);
			} else {
				const rawBody = await context.req.json().catch(() => ({}));
				inputData = config.inputSchema.parse(rawBody);
			}
		} else {
			inputData = {} as TInput;
		}

		// Call Effect handler with auto-provided OrganizationContext
		const effect = config.handler(inputData, context).pipe(
			Effect.provideService(OrganizationContext, {
				organizationId: context.workspace.id,
			}),
			// Validate output with Zod schema
			Effect.map((result) => config.outputSchema.parse(result)),
		);

		// Convert Effect to Response (handles all errors automatically)
		return runEffectAsResponse(effect);
	};

	// Use existing workspace context infrastructure
	return withEnhancedApiContext(wrappedHandler, {
		...config.options,
		requireWorkspace: true,
	});
}
