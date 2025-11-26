import type { IdempotencyStore } from "./store";

// TODO: For prod, swap for RedisIdempotencyStore
interface CacheEntry<T> {
	value: T;
	expiresAt: number;
}

export class MemoryIdempotencyStore implements IdempotencyStore {
	private cache: Map<string, CacheEntry<any>>;
	private cleanupInterval: ReturnType<typeof setInterval> | null;

	constructor() {
		this.cache = new Map();

		const FIVE_MINS = 5 * 60 * 1000;
		// cleanup expired
		this.cleanupInterval = setInterval(() => {
			this.cleanup();
		}, FIVE_MINS);
	}

	async get<T>(key: string): Promise<T | null> {
		const entry = this.cache.get(key);

		if (!entry) {
			return null;
		}

		// Check if expired
		if (Date.now() > entry.expiresAt) {
			this.cache.delete(key);
			return null;
		}

		return entry.value as T;
	}

	async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
		const expiresAt = Date.now() + ttlMs;

		this.cache.set(key, {
			value,
			expiresAt,
		});
	}

	async delete(key: string): Promise<void> {
		this.cache.delete(key);
	}

	async clear(): Promise<void> {
		this.cache.clear();
	}

	/**Clean up expired entries*/
	private cleanup(): void {
		const now = Date.now();

		for (const [key, entry] of this.cache.entries()) {
			if (now > entry.expiresAt) {
				this.cache.delete(key);
			}
		}
	}

	/**Stop cleanup interval (for graceful shutdown)*/
	destroy(): void {
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
			this.cleanupInterval = null;
		}
	}
}

export const memoryIdempotencyStore = new MemoryIdempotencyStore();
