import type { Redis } from 'ioredis'
import { logger } from '@repo/utils'
import { withCacheOperation } from './cache-operations'
import type { CacheKey } from './cache-keys'
import type { TTLValue } from './ttl-strategies'
import { TTL } from './ttl-strategies'

export interface CacheGetOrSetOptions {
    ttl?: TTLValue
    /** Whether to bypass cache and always fetch fresh data */
    bypassCache?: boolean
    /** Whether to update cache in background if bypassed */
    refreshCache?: boolean
}

export interface InvalidationOptions {
    /** Whether to invalidate matching patterns asynchronously */
    async?: boolean
}

export class CacheService {
    constructor(private redis: Redis | null) {
        if (!redis) {
            logger.warn('CacheService initialized without Redis - operating in fallback mode')
        }
    }

    private isAvailable(): boolean {
        return this.redis !== null && this.redis.status === 'ready'
    }

    /**
     * This method implements the cache-aside pattern:
     * 1. Try to get from cache
     * 2. If miss, fetch from source
     * 3. Store in cache for future requests
     * 4. Return the data
     * 
     * @param key - Cache key (can be string or CacheKey object)
     * @param fetchFn - Function to fetch fresh data on cache miss
     * @param options - Cache options (TTL, bypass, etc.)
     * @returns Cached or fresh data
     * 
     * @example
     * ```ts
     * const orders = await cacheService.getOrSet(
     *   CacheKeys.orders.list('org_123'),
     *   () => db.orders.findMany({ where: { orgId: 'org_123' } }),
     *   { ttl: DOMAIN_TTL.ORDER_LIST }
     * )
     * ```
     */
    async getOrSet<T>(
        key: string | CacheKey,
        fetchFn: () => Promise<T>,
        options: CacheGetOrSetOptions = {}
    ): Promise<T> {
        const cacheKey = typeof key === 'string' ? key : key.key
        const ttl = options.ttl ?? TTL.STANDARD

        // If cache is bypassed, fetch fresh and optionally update cache in background
        if (options.bypassCache) {
            const fresh = await fetchFn()

            if (options.refreshCache && this.isAvailable()) {
                // Update cache asynchronously without blocking
                this.set(cacheKey, fresh, ttl).catch(err => {
                    logger.error('Background cache refresh failed', err instanceof Error ? err : new Error(String(err)), {
                        cacheKey
                    })
                })
            }

            return fresh
        }

        // If Redis is not available, fallback to source
        if (!this.isAvailable()) {
            logger.debug('Cache unavailable, fetching from source', { cacheKey })
            return fetchFn()
        }

        // Try to get from cache
        return withCacheOperation(
            { operation: 'get', key: cacheKey, ttl },
            async () => {
                try {
                    const cached = await this.redis!.get(cacheKey)

                    if (cached !== null) {
                        // Cache hit - deserialize and return
                        return JSON.parse(cached) as T
                    }

                    // Cache miss - fetch fresh data
                    const fresh = await fetchFn()

                    // Store in cache for next time
                    await this.redis!.setex(cacheKey, ttl, JSON.stringify(fresh))

                    return fresh
                } catch (error) {
                    // On any cache error, fallback to source
                    logger.error(
                        'Cache operation failed, falling back to source',
                        error instanceof Error ? error : new Error(String(error)),
                        { cacheKey }
                    )
                    return fetchFn()
                }
            }
        )
    }

    /**
     * Get value from cache
     * 
     * @param key - Cache key
     * @returns Cached value or null if not found
     * 
     * @example
     * ```ts
     * const cached = await cacheService.get<Order[]>('orders:org:123')
     * if (cached) {
     *   return cached
     * }
     * ```
     */
    async get<T>(key: string | CacheKey): Promise<T | null> {
        const cacheKey = typeof key === 'string' ? key : key.key

        if (!this.isAvailable()) {
            return null
        }

        return withCacheOperation(
            { operation: 'get', key: cacheKey },
            async () => {
                try {
                    const value = await this.redis!.get(cacheKey)
                    return value ? (JSON.parse(value) as T) : null
                } catch (error) {
                    logger.error(
                        'Failed to get value from cache',
                        error instanceof Error ? error : new Error(String(error)),
                        { cacheKey }
                    )
                    return null
                }
            }
        )
    }

    /**
     * Set value in cache
     * 
     * @param key - Cache key
     * @param value - Value to cache
     * @param ttl - Time-to-live in seconds
     * 
     * @example
     * ```ts
     * await cacheService.set('orders:org:123', orders, 3600)
     * ```
     */
    async set<T>(key: string | CacheKey, value: T, ttl: TTLValue = TTL.STANDARD): Promise<void> {
        const cacheKey = typeof key === 'string' ? key : key.key

        if (!this.isAvailable()) {
            return
        }

        return withCacheOperation(
            { operation: 'set', key: cacheKey, ttl },
            async () => {
                await this.redis!.setex(cacheKey, ttl, JSON.stringify(value))
            }
        )
    }

    /**
     * Delete a specific cache key
     * 
     * @param key - Cache key to delete
     * 
     * @example
     * ```ts
     * await cacheService.invalidate('orders:org:123')
     * ```
     */
    async invalidate(key: string | CacheKey): Promise<void> {
        const cacheKey = typeof key === 'string' ? key : key.key

        if (!this.isAvailable()) {
            return
        }

        return withCacheOperation(
            { operation: 'del', key: cacheKey },
            async () => {
                await this.redis!.del(cacheKey)
            }
        )
    }

    /**
     * Invalidate multiple keys matching a pattern
     * 
     * Uses Redis SCAN for safe pattern matching without blocking
     * 
     * @param pattern - Redis pattern (e.g., 'orders:org:123*')
     * @param options - Invalidation options
     * 
     * @example
     * ```ts
     * // Invalidate all order caches for org 123
     * await cacheService.invalidatePattern('orders:org:123*')
     * ```
     */
    async invalidatePattern(pattern: string, options: InvalidationOptions = {}): Promise<number> {
        if (!this.isAvailable()) {
            return 0
        }

        const invalidateFn = async (): Promise<number> => {
            return withCacheOperation(
                { operation: 'del', key: pattern },
                async () => {
                    const keys: string[] = []
                    let cursor = '0'

                    // Use SCAN to find keys matching pattern
                    do {
                        const [nextCursor, matchedKeys] = await this.redis!.scan(
                            cursor,
                            'MATCH',
                            pattern,
                            'COUNT',
                            100
                        )
                        cursor = nextCursor
                        keys.push(...matchedKeys)
                    } while (cursor !== '0')

                    // Delete all matched keys
                    if (keys.length > 0) {
                        await this.redis!.del(...keys)
                    }

                    return keys.length
                }
            )
        }

        // If async invalidation requested, run in background
        if (options.async) {
            invalidateFn().catch(err => {
                logger.error(
                    'Async invalidation failed',
                    err instanceof Error ? err : new Error(String(err)),
                    { pattern }
                )
            })
            return 0
        }

        return invalidateFn()
    }

    /**
     * Invalidate all keys associated with specific tags
     * 
     * Note: This requires keys to be tagged using the CacheKeys builders
     * 
     * @param tags - Tags to invalidate
     * 
     * @example
     * ```ts
     * // Invalidate all caches for org 123
     * await cacheService.invalidateByTags(['org'])
     * ```
     */
    async invalidateByTags(tags: string[]): Promise<number> {
        if (!this.isAvailable()) {
            return 0
        }

        let totalDeleted = 0

        for (const tag of tags) {
            const pattern = `*@*${tag}*`
            const deleted = await this.invalidatePattern(pattern)
            totalDeleted += deleted
        }

        return totalDeleted
    }

    /**
     * Batch invalidate multiple keys at once
     * 
     * @param keys - Array of cache keys
     * 
     * @example
     * ```ts
     * await cacheService.invalidateMany([
     *   'orders:org:123',
     *   'orders:stats:123',
     *   'campaigns:org:123'
     * ])
     * ```
     */
    async invalidateMany(keys: Array<string | CacheKey>): Promise<void> {
        if (!this.isAvailable() || keys.length === 0) {
            return
        }

        const cacheKeys = keys.map(k => typeof k === 'string' ? k : k.key)

        return withCacheOperation(
            { operation: 'del', key: `batch:${cacheKeys.length}` },
            async () => {
                await this.redis!.del(...cacheKeys)
            }
        )
    }

    /**
     * Check if a key exists in cache
     * 
     * @param key - Cache key to check
     * @returns true if exists, false otherwise
     * 
     * @example
     * ```ts
     * if (await cacheService.exists('orders:org:123')) {
     *   console.log('Orders are cached')
     * }
     * ```
     */
    async exists(key: string | CacheKey): Promise<boolean> {
        const cacheKey = typeof key === 'string' ? key : key.key

        if (!this.isAvailable()) {
            return false
        }

        return withCacheOperation(
            { operation: 'exists', key: cacheKey },
            async () => {
                const result = await this.redis!.exists(cacheKey)
                return result === 1
            }
        )
    }

    /**
     * Get remaining TTL for a key
     * 
     * @param key - Cache key
     * @returns Remaining TTL in seconds, or -1 if key doesn't exist
     * 
     * @example
     * ```ts
     * const ttl = await cacheService.getTTL('orders:org:123')
     * console.log(`Cache expires in ${ttl} seconds`)
     * ```
     */
    async getTTL(key: string | CacheKey): Promise<number> {
        const cacheKey = typeof key === 'string' ? key : key.key

        if (!this.isAvailable()) {
            return -1
        }

        return withCacheOperation(
            { operation: 'get', key: cacheKey },
            async () => {
                return this.redis!.ttl(cacheKey)
            }
        )
    }

    /**
     * Refresh TTL for a key (extend expiration)
     * 
     * @param key - Cache key
     * @param ttl - New TTL in seconds
     * 
     * @example
     * ```ts
     * // Extend cache for another hour
     * await cacheService.refreshTTL('orders:org:123', 3600)
     * ```
     */
    async refreshTTL(key: string | CacheKey, ttl: TTLValue): Promise<void> {
        const cacheKey = typeof key === 'string' ? key : key.key

        if (!this.isAvailable()) {
            return
        }

        return withCacheOperation(
            { operation: 'set', key: cacheKey, ttl },
            async () => {
                await this.redis!.expire(cacheKey, ttl)
            }
        )
    }

    /**
     * Clear all cache (use with caution!)
     * 
     * @example
     * ```ts
     * // Only in development/testing
     * await cacheService.clearAll()
     * ```
     */
    async clearAll(): Promise<void> {
        if (!this.isAvailable()) {
            return
        }

        logger.warn('Clearing all cache - this should only be done in development!')

        return withCacheOperation(
            { operation: 'del', key: '*' },
            async () => {
                await this.redis!.flushdb()
            }
        )
    }

    /**
     * Get cache statistics
     * 
     * @returns Redis info and statistics
     * 
     * @example
     * ```ts
     * const stats = await cacheService.getStats()
     * console.log(`Cache has ${stats.keys} keys`)
     * ```
     */
    async getStats(): Promise<{
        available: boolean
        keys: number
        memoryUsed?: string
        hitRate?: string
    }> {
        if (!this.isAvailable()) {
            return { available: false, keys: 0 }
        }

        try {
            const dbsize = await this.redis!.dbsize()
            const info = await this.redis!.info('stats')

            // Parse info string for stats
            const hitRate = info.match(/keyspace_hits:(\d+)/)?.[1]
            const misses = info.match(/keyspace_misses:(\d+)/)?.[1]
            const hits = hitRate ? parseInt(hitRate) : 0
            const totalRequests = hits + (misses ? parseInt(misses) : 0)
            const rate = totalRequests > 0 ? ((hits / totalRequests) * 100).toFixed(2) : '0'

            return {
                available: true,
                keys: dbsize,
                hitRate: `${rate}%`,
            }
        } catch (error) {
            logger.error(
                'Failed to get cache stats',
                error instanceof Error ? error : new Error(String(error))
            )
            return { available: false, keys: 0 }
        }
    }
}
