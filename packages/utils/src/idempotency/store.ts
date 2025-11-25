export interface IdempotencyStore {
    /**
     * Get cached result by key
     */
    get<T>(key: string): Promise<T | null>;

    /**
     * Store result with TTL
     */
    set<T>(key: string, value: T, ttlMs: number): Promise<void>;

    /**
     * Delete cached result
     */
    delete(key: string): Promise<void>;

    /**
     * Clear all cached results (for testing)
     */
    clear?(): Promise<void>;
}
