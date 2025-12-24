/**
 * Effect ↔ Mastra Bridge
 * 
 * Promco uses Effect for "errors as data" and type-safe error handling.
 * This bridge allows Mastra agents/tools to work with Effect-based services.
 * 
 * Pattern:
 * - Services return Effect<A, E, R>
 * - Mastra expects Promise<A>
 * - Bridge converts Effect → Promise, surfaces errors properly
 */

import { Effect, Exit } from 'effect';
import { createError } from '@repo/utils';

/**
 * Run an Effect and convert to Promise for Mastra
 * 
 * @example
 * const result = await runEffect(
 *   fifoService.getCurrentStock(productId)
 * );
 */
export async function runEffect<A, E>(
    effect: Effect.Effect<A, E, never>
): Promise<A> {
    const exit = await Effect.runPromiseExit(effect);

    return Exit.match(exit, {
        onSuccess: (value) => value,
        onFailure: (cause) => {
            // Convert Effect failures to standard errors for Mastra
            const error = new Error(
                `Effect failed: ${JSON.stringify(cause)}`
            );
            throw error;
        },
    });
}

/**
 * Wrap a Mastra tool execution to return Effect
 * 
 * This allows you to compose Mastra tools within Effect pipelines.
 * 
 * @example
 * const stockEffect = wrapMastraTool(() => 
 *   inventoryTool.execute({ productId })
 * );
 */
export function wrapMastraTool<A>(
    fn: () => Promise<A>
): Effect.Effect<A, Error, never> {
    return Effect.tryPromise({
        try: fn,
        catch: (error) => {
            if (error instanceof Error) return error;
            return new Error(String(error));
        },
    });
}

/**
 * Convert Effect service to Mastra-compatible tool executor
 * 
 * @example
 * const inventoryTool = createTool({
 *   id: 'check-inventory',
 *   execute: effectToToolExecutor(
 *     (input) => fifoService.getCurrentStock(input.productId)
 *   )
 * });
 */
export function effectToToolExecutor<Input, Output, E>(
    effectFn: (input: Input) => Effect.Effect<Output, E, never>
): (input: Input) => Promise<Output> {
    return async (input: Input) => {
        return runEffect(effectFn(input));
    };
}
