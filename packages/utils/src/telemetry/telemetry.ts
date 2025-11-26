import {
	type Attributes,
	type AttributeValue,
	type Span,
	SpanKind,
	SpanStatusCode,
	trace,
} from "@opentelemetry/api";

const tracer = trace.getTracer("promco-backend", "1.0.0");

export async function traceSpan<T>(
	optionsOrDescription:
		| string
		| {
				description: string;
				attributes?: Record<string, AttributeValue>;
				kind?: SpanKind;
		  },
	fn: (span: Span) => Promise<T>,
	kind: SpanKind = SpanKind.INTERNAL,
): Promise<T> {
	const options =
		typeof optionsOrDescription === "string"
			? { description: optionsOrDescription }
			: optionsOrDescription;

	return await tracer.startActiveSpan(
		`PROMCO: ${options.description}`,
		{
			kind: options.kind || SpanKind.INTERNAL,
			attributes: options.attributes || {},
		},
		async (span) => {
			try {
				span.addEvent("span.start", {
					"span.name": options.description,
					timestamp: Date.now(),
				});

				const result = await fn(span);

				span.addEvent("span.success", {
					"span.name": options.description,
					timestamp: Date.now(),
				});

				span.setStatus({ code: SpanStatusCode.OK });
				return result;
			} catch (error) {
				span.addEvent("span.error", {
					"error.name": error instanceof Error ? error.name : "Unknown",
					"error.message":
						error instanceof Error ? error.message : String(error),
					"error.stack": error instanceof Error ? error.stack : undefined,
					timestamp: Date.now(),
				});

				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: error instanceof Error ? error.message : String(error),
				});

				span.setAttribute("error", true);
				throw error;
			} finally {
				span.end();
			}
		},
	);
}

export async function traceCacheOperation<T>(
	operation: "get" | "set" | "del",
	key: string,
	fn: () => Promise<T>,
): Promise<T> {
	return traceSpan(
		`cache.${operation}`,
		async (span) => {
			span.setAttributes({
				"cache.system": "redis",
				"cache.operation": operation,
				"cache.key": key,
			});

			const start = performance.now();
			const result = await fn();
			const duration = performance.now() - start;

			span.setAttributes({
				"cache.duration_ms": duration,
				"cache.hit": operation === "get" && result !== null,
			});

			return result;
		},
		SpanKind.CLIENT,
	);
}

export function withTraceSpan<P extends any[], T>(
	optionsOrDescription:
		| string
		| {
				description: string;
				attributes?: Record<string, AttributeValue>;
				kind?: SpanKind;
		  },
	fn: (...args: P) => Promise<T>,
): (...args: P) => Promise<T> {
	return async (...args: P) => {
		return await traceSpan(optionsOrDescription, () => fn(...args));
	};
}

export const logger = {
	info: (message: string, attributes: Attributes = {}) => {
		const span = trace.getActiveSpan();
		if (span) {
			span.addEvent("log.info", {
				"log.message": message,
				"log.level": "info",
				timestamp: Date.now(),
				...attributes,
			});
		} else {
			console.log(`[INFO] ${message}`, attributes);
		}
	},

	warn: (message: string, attributes: Attributes = {}) => {
		const span = trace.getActiveSpan();
		if (span) {
			span.addEvent("log.warn", {
				"log.message": message,
				"log.level": "warn",
				timestamp: Date.now(),
				...attributes,
			});
		} else {
			console.warn(`[WARN] ${message}`, attributes);
		}
	},

	error: (message: string, error?: Error, attributes: Attributes = {}) => {
		const span = trace.getActiveSpan();
		if (span) {
			span.addEvent("log.error", {
				"log.message": message,
				"log.level": "error",
				"error.name": error?.name,
				"error.message": error?.message,
				"error.stack": error?.stack,
				timestamp: Date.now(),
				...attributes,
			});
		} else {
			console.error(`[ERROR] ${message}`, error, attributes);
		}
	},
	debug: (message: string, attributes: Attributes = {}) => {
		const span = trace.getActiveSpan();
		if (span) {
			span.addEvent("log.debug", {
				"log.message": message,
				"log.level": "debug",
				timestamp: Date.now(),
				...attributes,
			});
		} else {
			if (process.env.NODE_ENV === "development") {
				console.debug(`[DEBUG] ${message}`, attributes);
			}
		}
	},
	perf: (operation: string, duration: number, attributes: Attributes = {}) => {
		const span = trace.getActiveSpan();
		if (span) {
			span.addEvent("performance.measurement", {
				operation: operation,
				"duration.ms": duration,
				timestamp: Date.now(),
				...attributes,
			});

			span.setAttribute("performance.duration_ms", duration);
		}
	},
};

export function toError(error: unknown): Error {
	return error instanceof Error ? error : new Error(String(error));
}

export const dbTrace = {
	query: async <T>(
		operation: string,
		query: string,
		fn: () => Promise<T>,
	): Promise<T> => {
		return await traceSpan(
			{
				description: `DB: ${operation}`,
				kind: SpanKind.CLIENT,
				attributes: {
					"db.operation": operation,
					"db.query":
						query.length > 1000 ? `${query.substring(0, 1000)}...` : query,
					"db.system": "postgresql",
				},
			},
			async (span) => {
				const start = performance.now();

				try {
					const result = await fn();
					const duration = performance.now() - start;

					logger.perf(`DB ${operation}`, duration, {
						"db.operation": operation,
						"db.rows_affected": Array.isArray(result) ? result.length : 1,
					});

					return result;
				} catch (error) {
					logger.error(`Database ${operation} failed`, toError(error), {
						"db.operation": operation,
						"db.query": query,
					});
					throw error;
				}
			},
		);
	},
};

export const cacheTrace = {
	operation: async <T>(
		operation: "get" | "set" | "del",
		key: string,
		fn: () => Promise<T>,
	): Promise<T> => {
		return await traceSpan(
			{
				description: `Cache: ${operation}`,
				kind: SpanKind.CLIENT,
				attributes: {
					"cache.operation": operation,
					"cache.key": key,
					"cache.system": "redis",
				},
			},
			async (span) => {
				const start = performance.now();

				try {
					const result = await fn();
					const duration = performance.now() - start;

					logger.perf(`Cache ${operation}`, duration, {
						"cache.operation": operation,
						"cache.key": key,
						"cache.hit": operation === "get" && result !== null,
					});

					return result;
				} catch (error) {
					logger.error(`Cache ${operation} failed`, toError(error), {
						"cache.operation": operation,
						"cache.key": key,
					});
					throw error;
				}
			},
		);
	},
};
