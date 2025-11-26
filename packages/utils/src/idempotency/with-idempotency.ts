import { memoryIdempotencyStore } from "./memory-store";
import type { IdempotencyStore } from "./store";
import type { IdempotencyOptions } from "./types";

/**
 * Execute operation with idempotency guarantee
 *
 * Prevents duplicate execution of operations (promo redemptions, webhooks, payments).
 *
 * @example
 * ```typescript
 * // Promo redemption
 * await withIdempotency(
 *   `${promoCode}-${orgId}`,
 *   async () => redeemPromo(promoCode, orgId),
 *   { namespace: 'promo_redemption', ttlMs: 3600000 }
 * );
 *
 * // Webhook processing
 * await withIdempotency(
 *   webhookEvent.id,
 *   async () => processSaleorWebhook(webhookEvent),
 *   { namespace: 'saleor_webhook' }
 * );
 * ```
 *
 * @param key - Unique identifier for this operation
 * @param operation - Function to execute (only runs once per key)
 * @param options - TTL and namespace configuration
 * @param store - Storage backend (defaults to in-memory, swap for Redis)
 * @returns Result of operation (cached if duplicate)
 */
export async function withIdempotency<T>(
	key: string,
	operation: () => Promise<T>,
	options?: IdempotencyOptions,
	store: IdempotencyStore = memoryIdempotencyStore,
): Promise<T> {
	const namespace = options?.namespace || "default";
	const ttlMs = options?.ttlMs || 86400000; // 24 hours default

	const idempotencyKey = `${namespace}:${key}`;

	// Check if already executed
	const cached = await store.get<T>(idempotencyKey);
	if (cached !== null) {
		return cached;
	}

	// Execute operation
	const result = await operation();

	// Cache result
	await store.set(idempotencyKey, result, ttlMs);

	return result;
}

/**
 * Check if operation has already been executed
 *
 * Useful for pre-flight checks without executing the operation.
 *
 * @param key - Unique identifier
 * @param options - Namespace configuration
 * @param store - Storage backend
 * @returns true if operation already executed
 */
export async function isIdempotent(
	key: string,
	options?: IdempotencyOptions,
	store: IdempotencyStore = memoryIdempotencyStore,
): Promise<boolean> {
	const namespace = options?.namespace || "default";
	const idempotencyKey = `${namespace}:${key}`;

	const cached = await store.get(idempotencyKey);
	return cached !== null;
}

/**
 * Invalidate cached result
 *
 * Use sparingly - only for manual intervention/debugging.
 *
 * @param key - Unique identifier
 * @param options - Namespace configuration
 * @param store - Storage backend
 */
export async function invalidateIdempotency(
	key: string,
	options?: IdempotencyOptions,
	store: IdempotencyStore = memoryIdempotencyStore,
): Promise<void> {
	const namespace = options?.namespace || "default";
	const idempotencyKey = `${namespace}:${key}`;

	await store.delete(idempotencyKey);
}
