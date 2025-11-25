import { NextRequest, NextResponse } from "next/server";
import { ZodType } from "@repo/schema";
import {
    withEnhancedApiContext,
    type EnhancedApiOptions,
} from "./with-enhanced-context";
import { type WorkspaceHandlerParams } from "./with-workspace-context";

interface BaseRouteConfig<TInput, TOutput> {
    inputSchema?: ZodType<TInput>;
    outputSchema: ZodType<TOutput>;
}

interface WorkspaceRouteConfig<TInput, TOutput> extends BaseRouteConfig<TInput, TOutput> {
    requireWorkspace?: true;
    handler: (
        data: TInput,
        context: WorkspaceHandlerParams
    ) => Promise<TOutput>;
    options: EnhancedApiOptions & { requireWorkspace?: true };
}

interface SimpleRouteConfig<TInput, TOutput> extends BaseRouteConfig<TInput, TOutput> {
    requireWorkspace: false;
    handler: (
        data: TInput,
        context: {
            req: NextRequest;
            params: Record<string, string>;
            searchParams: Record<string, string>;
            headers: Record<string, string>;
            session: any;
        }
    ) => Promise<TOutput>;
    options: EnhancedApiOptions & { requireWorkspace: false };
}

type RouteConfig<TInput, TOutput> =
    | WorkspaceRouteConfig<TInput, TOutput>
    | SimpleRouteConfig<TInput, TOutput>;

export function createApiRoute<TInput, TOutput>(
    config: RouteConfig<TInput, TOutput>
) {
    // Wrap the handler to inject validation layer
    const wrappedHandler = async (context: any) => {
        let inputData: TInput;

        // INPUT VALIDATION
        if (config.inputSchema) {
            // GET requests do not have bodies — use search params instead
            if (context.req.method === "GET") {
                const query = Object.fromEntries(
                    context.req.nextUrl.searchParams.entries()
                );
                inputData = config.inputSchema.parse(query);
            } else {
                // For POST/PUT/PATCH, try to read JSON body (may be empty)
                const rawBody = await context.req.json().catch(() => ({}));
                inputData = config.inputSchema.parse(rawBody);
            }
        } else {
            // No input schema defined
            inputData = {} as TInput;
        }

        // call business logic handler
        const result = await config.handler(inputData, context);

        // output validation
        const validatedResult = config.outputSchema.parse(result);

        return NextResponse.json({
            success: true,
            data: validatedResult,
        });
    };

    // Type narrowing before calling withEnhancedApiContext
    if (config.requireWorkspace === false) {
        // public route overload
        return withEnhancedApiContext(wrappedHandler, {
            ...config.options,
            requireWorkspace: false,
        });
    }

    // workspace route overload
    return withEnhancedApiContext(wrappedHandler, {
        ...config.options,
        requireWorkspace: true,
    });
}

/**
 * Create a workspace-scoped API route
 * - Requires organizationId
 * - Has full workspace context
 * - Permission checks enabled
 */
export function createWorkspaceRoute<TInput, TOutput>(
    config: Omit<WorkspaceRouteConfig<TInput, TOutput>, "requireWorkspace">
) {
    return createApiRoute({
        ...config,
        requireWorkspace: true,
    } as WorkspaceRouteConfig<TInput, TOutput>);
}

/**
 * Create a public API route
 * - No workspace required
 * - Session optional (unless specified in options)
 * - Use for webhooks, public endpoints, etc.
 */
export function createPublicRoute<TInput, TOutput>(
    config: Omit<SimpleRouteConfig<TInput, TOutput>, "requireWorkspace">
) {
    return createApiRoute({
        ...config,
        requireWorkspace: false,
        options: {
            ...config.options,
            skipPermissionChecks: true,
        },
    } as SimpleRouteConfig<TInput, TOutput>);
}