import {
	createError,
	type ErrorContext,
	SpanKind,
	withErrorTrace,
} from "@repo/utils";

export interface CacheOperationOptions {
	operation: "get" | "set" | "del" | "exists";
	key: string;
	ttl?: number;
	context?: ErrorContext;
}

export async function withCacheOperation<T>(
	options: CacheOperationOptions,
	fn: () => Promise<T>,
): Promise<T> {
	return withErrorTrace(
		{
			operation: `Cache: ${options.operation}`,
			kind: SpanKind.CLIENT,
			attributes: {
				"cache.system": "redis",
				"cache.operation": options.operation,
				"cache.key": options.key,
				"cache.ttl": options.ttl,
			},
			errorContext: options.context,
		},
		async (span) => {
			try {
				const result = await fn();

				span.setAttributes({
					"cache.hit": options.operation === "get" && result !== null,
					"cache.success": true,
				});

				return result;
			} catch (error) {
				throw createError.external("Redis", error as Error, {
					...options.context,
					cache_key: options.key,
					cache_operation: options.operation,
				});
			}
		},
	);
}
