import { type Span, SpanKind, SpanStatusCode, trace } from "@opentelemetry/api";
import { errorHandler } from "../errors/error-handler";
import type { ErrorContext } from "./error";

export interface TraceOptions {
	operation: string;
	kind?: SpanKind;
	attributes?: Record<string, any>;
	errorContext?: ErrorContext;
}

export async function withErrorTrace<T>(
	options: TraceOptions,
	fn: (span: Span) => Promise<T>,
): Promise<T> {
	const tracer = trace.getTracer("promco-backend", "1.0.0");

	return tracer.startActiveSpan(
		`PROMCO: ${options.operation}`,
		{
			kind: options.kind || SpanKind.INTERNAL,
			attributes: {
				"operation.name": options.operation,
				"operation.timestamp": new Date().toISOString(),
				...options.attributes,
			},
		},
		async (span) => {
			const startTime = performance.now();

			try {
				span.addEvent("operation.start", {
					"operation.name": options.operation,
					timestamp: Date.now(),
				});

				const result = await fn(span);

				const duration = performance.now() - startTime;

				span.addEvent("operation.success", {
					"operation.name": options.operation,
					"operation.duration_ms": duration,
					timestamp: Date.now(),
				});

				span.setAttributes({
					"operation.success": true,
					"operation.duration_ms": duration,
				});

				span.setStatus({ code: SpanStatusCode.OK });
				return result;
			} catch (error) {
				const duration = performance.now() - startTime;

				const promcoError = errorHandler.handleError(error, {
					operation: options.operation,
					context: {
						...options.errorContext,
						duration_ms: duration,
					},
					span,
				});

				throw promcoError;
			} finally {
				span.end();
			}
		},
	);
}

export function withApiTrace<T extends any[], R>(
	operation: string,
	handler: (...args: T) => Promise<R>,
	errorContext?: ErrorContext,
) {
	return async (...args: T): Promise<R> => {
		return withErrorTrace(
			{
				operation,
				kind: SpanKind.SERVER,
				errorContext,
			},
			async () => handler(...args),
		);
	};
}
