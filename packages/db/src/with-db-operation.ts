import {
	createError,
	type ErrorContext,
	SpanKind,
	withErrorTrace,
} from "@repo/utils";
import db from "./index";

export interface DbOperationContext {
	operation: string;
	table: string;
	context?: Record<string, any>;
}

/**
 * Execute database operation with OpenTelemetry tracing
 *
 * Wraps database queries/mutations with OTEL spans for observability.
 * Captures operation type, table name, and custom context as span attributes.
 *
 * @example
 * ```typescript
 * const user = await withDbOperation({
 *   operation: "findUnique",
 *   table: "users",
 *   context: { userId: "123" }
 * }, () => db.select().from(users).where(eq(users.id, "123")));
 * ```
 */
export async function withDbOperation<T>(
	config: DbOperationContext,
	operation: () => Promise<T>,
): Promise<T> {
	return withErrorTrace(
		{
			operation: `DB: ${config.table}.${config.operation}`,
			kind: SpanKind.CLIENT,
			attributes: {
				"db.system": "postgresql",
				"db.operation": config.operation,
				"db.table": config.table,
				"db.driver": "neon-serverless",
				// Add custom context as attributes (prefixed for clarity)
				...(config.context &&
					Object.entries(config.context).reduce(
						(acc, [key, value]) => {
							acc[`db.context.${key}`] = value;
							return acc;
						},
						{} as Record<string, any>,
					)),
			},
			errorContext: config.context,
		},
		async (span) => {
			try {
				const result = await operation();

				// Mark operation as successful
				span.setAttributes({
					"db.success": true,
				});

				return result;
			} catch (error) {
				// Properly handle drizzle errors
				const {
					handleDrizzleError,
				} = require("./handle-drizzle-error-traditional");

				// Classify the PostgreSQL error and throw typed PromcoError
				// This gives proper status codes:
				// - 409 for unique constraints
				// - 400 for foreign key/not null violations
				// - 504 for timeouts
				// - 500 for generic DB errors
				handleDrizzleError(error, {
					...config.context,
					operation: config.operation,
					table: config.table,
				});

				throw error;
			}
		},
	);
}

/**
 * Execute operations within a database transaction with OTEL tracing
 *
 * Provides ACID guarantees for multi-step operations.
 * Critical for FIFO batch allocation to prevent race conditions.
 *
 * @example
 * ```typescript
 * await withTransaction(async (tx) => {
 *   const batch = await tx.select()...for('update'); // Row lock
 *   await tx.insert(inventoryMovements).values(...);
 *   await tx.update(products).set(...);
 * });
 * ```
 *
 * @param callback - Transaction callback with tx parameter
 * @returns Result of transaction
 */
export async function withTransaction<T>(
	callback: Parameters<typeof db.transaction>[0],
): Promise<T> {
	return withErrorTrace(
		{
			operation: "DB: Transaction",
			kind: SpanKind.CLIENT,
			attributes: {
				"db.system": "postgresql",
				"db.operation": "transaction",
				"db.driver": "neon-serverless",
				"db.transaction": true,
			},
		},
		async (span) => {
			try {
				const result = await db.transaction(callback);

				span.setAttributes({
					"db.success": true,
					"db.transaction.committed": true,
				});

				return result as T;
			} catch (error) {
				span.setAttributes({
					"db.transaction.committed": false,
					"db.transaction.rollback": true,
				});

				// Properly handle transaction errors
				const {
					handleDrizzleError,
				} = require("./handle-drizzle-error-traditional");
				handleDrizzleError(error, {
					operation: "transaction",
				});

				throw error;
			}
		},
	);
}
