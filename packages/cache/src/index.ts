/**
 * @repo/cache - Production-ready cache abstraction layer
 * 
 * This package provides a comprehensive caching solution with:
 * - Redis connection management with automatic reconnection
 * - CacheService for high-level cache operations
 * - Type-safe cache key builders
 * - Event-driven cache invalidation
 * - TTL strategies for different data types
 * - Observability via tracing
 * - Graceful degradation when Redis is unavailable
 * 
 * @example
 * ```ts
 * import { cacheService, CacheKeys, DOMAIN_TTL } from '@repo/cache'
 * 
 * // Use getOrSet pattern
 * const orders = await cacheService.getOrSet(
 *   CacheKeys.orders.list('org_123'),
 *   () => db.orders.findMany({ where: { orgId: 'org_123' } }),
 *   { ttl: DOMAIN_TTL.ORDER_LIST }
 * )
 * 
 * // Invalidate on changes
 * await cacheService.invalidatePattern('orders:org:123*')
 * ```
 */

import { logger } from "@repo/utils";
import Redis from "ioredis";
import { CacheService } from "./cache-service";

const isClient = typeof window !== "undefined";

let redisInstance: any = null;

const getRedisInstance = () => {
  if (isClient) {
    console.error("[@repo/cache] Redis should never be used on the client side.");
    return null;
  }

  if (!redisInstance) {
    const getRedisUrl = (): string => {
      const redisUrl = "redis://default:ZPFyGd2ClDSZ4YHQFSzzUZNJ9bIvZgOF@redis-18280.c341.af-south-1-1.ec2.redns.redis-cloud.com:18280"

      if (!redisUrl) {
        console.error("REDIS_URL is not defined");
        throw new Error("REDIS_URL is not defined");
      }
      return redisUrl;
    };

    redisInstance = new Redis(getRedisUrl(), {
      maxRetriesPerRequest: null,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        console.warn(`Redis connection failed. Retrying in ${delay}ms`);
        return delay;
      },
      connectTimeout: 10000,
    });

    redisInstance.on("error", (err: Error) => console.error("Redis error", err.message));
    redisInstance.on("ready", () => logger.info("Redis connection established"));
    redisInstance.on("close", () => logger.warn("Redis connection closed"));
    redisInstance.on("end", () => logger.info("Redis connection ended"));
    redisInstance.on("reconnecting", () => logger.info("Redis reconnecting..."));
  }

  return redisInstance;
};

/**
 * Raw Redis client instance
 * Use this only when you need direct Redis access
 * For most cases, use `cacheService` instead
 */
export const redis = getRedisInstance();

/**
 * Singleton CacheService instance
 * This is the main entry point for cache operations
 * 
 * @example
 * ```ts
 * import { cacheService } from '@repo/cache'
 * 
 * const data = await cacheService.getOrSet(
 *   'my-key',
 *   () => fetchData(),
 *   { ttl: 3600 }
 * )
 * ```
 */
export const cacheService = new CacheService(redis);

// Export types and classes
export type { Redis }
export { CacheService } from './cache-service'
export type {
  CacheGetOrSetOptions,
  InvalidationOptions
} from './cache-service'

// Export cache operations wrapper
export { withCacheOperation } from './cache-operations'
export type { CacheOperationOptions } from './cache-operations'

// Export cache keys
export { CacheKeys, pattern, tagPattern } from './cache-keys'
export {
  OrderKeys,
  ProductKeys,
  CampaignKeys,
  UserKeys,
  AnalyticsKeys,
  ExternalKeys
} from './cache-keys'
export type { CacheKey } from './cache-keys'

// Export TTL strategies
export {
  TTL,
  DOMAIN_TTL,
  calculateDynamicTTL,
  getTimeBasedTTL,
  getAgeBasedTTL
} from './ttl-strategies'
export type { TTLValue, TTLStrategy } from './ttl-strategies'

export {
  cacheEvents,
  emitOrderEvent,
  emitProductEvent,
  emitCampaignEvent,
  emitUserEvent,
  batchEmitEvents,
  registerEventHandlers,
  clearAllEventListeners
} from './cache-events'
export type {
  CacheEvents,
  CacheEventName,
  OrderEvents,
  ProductEvents,
  CampaignEvents,
  UserEvents
} from './cache-events'