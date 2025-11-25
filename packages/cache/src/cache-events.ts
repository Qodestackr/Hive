/**
 * Cache Event System for Invalidation
 * 
 * This module provides an event-driven approach to cache invalidation.
 * When domain events occur (e.g., order created, product updated),
 * emit events to automatically invalidate related cache entries.
 * 
 * @module cache-events
 */

import { EventEmitter } from 'events'

/**
 * Base event payload structure
 */
interface BaseEventPayload {
    /** Organization ID for scoping */
    orgId: string
    /** Event timestamp */
    timestamp: Date
    /** Optional metadata */
    metadata?: Record<string, unknown>
}

/**
 * Order-related events
 */
export interface OrderEvents {
    'order:created': BaseEventPayload & {
        orderId: string
        status: string
    }
    'order:updated': BaseEventPayload & {
        orderId: string
        status?: string
        previousStatus?: string
    }
    'order:deleted': BaseEventPayload & {
        orderId: string
    }
    'order:status_changed': BaseEventPayload & {
        orderId: string
        status: string
        previousStatus: string
    }
}

/**
 * Product-related events
 */
export interface ProductEvents {
    'product:created': BaseEventPayload & {
        productId: string
        sku: string
    }
    'product:updated': BaseEventPayload & {
        productId: string
        sku: string
    }
    'product:deleted': BaseEventPayload & {
        productId: string
        sku: string
    }
    'product:inventory_changed': BaseEventPayload & {
        productId: string
        previousQuantity: number
        newQuantity: number
    }
}

/**
 * Campaign-related events
 */
export interface CampaignEvents {
    'campaign:created': BaseEventPayload & {
        campaignId: string
    }
    'campaign:updated': BaseEventPayload & {
        campaignId: string
    }
    'campaign:deleted': BaseEventPayload & {
        campaignId: string
    }
    'campaign:promo_redeemed': BaseEventPayload & {
        campaignId: string
        promoCode: string
        orderId: string
    }
}

/**
 * User & Organization events
 */
export interface UserEvents {
    'user:updated': BaseEventPayload & {
        userId: string
    }
    'user:permissions_changed': BaseEventPayload & {
        userId: string
    }
    'org:settings_updated': BaseEventPayload & {}
    'org:member_added': BaseEventPayload & {
        userId: string
    }
    'org:member_removed': BaseEventPayload & {
        userId: string
    }
}

/**
 * All cache invalidation events
 */
export type CacheEvents = OrderEvents & ProductEvents & CampaignEvents & UserEvents

/**
 * Event names for type safety
 */
export type CacheEventName = keyof CacheEvents

/**
 * Type-safe cache event emitter
 */
class CacheEventEmitter extends EventEmitter {
    /**
     * Emit a cache event
     */
    emitEvent<E extends CacheEventName>(event: E, payload: CacheEvents[E]): void {
        this.emit(event, payload)
    }

    /**
     * Listen to a cache event
     */
    onEvent<E extends CacheEventName>(
        event: E,
        listener: (payload: CacheEvents[E]) => void | Promise<void>
    ): void {
        this.on(event, listener)
    }

    /**
     * Listen to a cache event once
     */
    onceEvent<E extends CacheEventName>(
        event: E,
        listener: (payload: CacheEvents[E]) => void | Promise<void>
    ): void {
        this.once(event, listener)
    }

    /**
     * Remove a listener for a cache event
     */
    offEvent<E extends CacheEventName>(
        event: E,
        listener: (payload: CacheEvents[E]) => void | Promise<void>
    ): void {
        this.off(event, listener)
    }
}

/**
 * Global cache event bus singleton
 */
export const cacheEvents = new CacheEventEmitter()

// Set max listeners to prevent warnings in development
cacheEvents.setMaxListeners(50)

/**
 * Helper: Emit order event
 * 
 * @example
 * ```ts
 * emitOrderEvent('order:created', {
 *   orgId: '123',
 *   orderId: 'order_456',
 *   status: 'pending',
 *   timestamp: new Date()
 * })
 * ```
 */
export function emitOrderEvent<E extends keyof OrderEvents>(
    event: E,
    payload: OrderEvents[E]
): void {
    cacheEvents.emitEvent(event as any, payload as any)
}

/**
 * Helper: Emit product event
 * 
 * @example
 * ```ts
 * emitProductEvent('product:inventory_changed', {
 *   orgId: '123',
 *   productId: 'prod_456',
 *   previousQuantity: 100,
 *   newQuantity: 95,
 *   timestamp: new Date()
 * })
 * ```
 */
export function emitProductEvent<E extends keyof ProductEvents>(
    event: E,
    payload: ProductEvents[E]
): void {
    cacheEvents.emitEvent(event as any, payload as any)
}

/**
 * Helper: Emit campaign event
 * 
 * @example
 * ```ts
 * emitCampaignEvent('campaign:promo_redeemed', {
 *   orgId: '123',
 *   campaignId: 'camp_456',
 *   promoCode: 'SAVE20',
 *   orderId: 'order_789',
 *   timestamp: new Date()
 * })
 * ```
 */
export function emitCampaignEvent<E extends keyof CampaignEvents>(
    event: E,
    payload: CampaignEvents[E]
): void {
    cacheEvents.emitEvent(event as any, payload as any)
}

/**
 * Helper: Emit user event
 * 
 * @example
 * ```ts
 * emitUserEvent('user:permissions_changed', {
 *   orgId: '123',
 *   userId: 'user_456',
 *   timestamp: new Date()
 * })
 * ```
 */
export function emitUserEvent<E extends keyof UserEvents>(
    event: E,
    payload: UserEvents[E]
): void {
    cacheEvents.emitEvent(event as any, payload as any)
}

/**
 * Batch emit multiple events
 * Useful when a single operation affects multiple cache domains
 * 
 * @example
 * ```ts
 * batchEmitEvents([
 *   { event: 'order:created', payload: {...} },
 *   { event: 'product:inventory_changed', payload: {...} }
 * ])
 * ```
 */
export function batchEmitEvents(events: Array<{
    event: CacheEventName
    payload: CacheEvents[CacheEventName]
}>): void {
    for (const { event, payload } of events) {
        cacheEvents.emitEvent(event, payload as any)
    }
}

/**
 * Register multiple event handlers at once
 * 
 * @example
 * ```ts
 * registerEventHandlers({
 *   'order:created': async (payload) => {
 *     await invalidateOrderCache(payload.orgId)
 *   },
 *   'product:updated': async (payload) => {
 *     await invalidateProductCache(payload.productId)
 *   }
 * })
 * ```
 */
export function registerEventHandlers(
    handlers: Partial<{
        [K in CacheEventName]: (payload: CacheEvents[K]) => void | Promise<void>
    }>
): void {
    for (const [event, handler] of Object.entries(handlers)) {
        if (handler) {
            cacheEvents.onEvent(event as CacheEventName, handler as any)
        }
    }
}

/**
 * Remove all listeners (useful for testing)
 */
export function clearAllEventListeners(): void {
    cacheEvents.removeAllListeners()
}
