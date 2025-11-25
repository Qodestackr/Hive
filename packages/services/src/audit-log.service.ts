/**
 * Audit Log Service
 * 
 * Service for logging and querying immutable audit events.
 * Used for trust-critical operations (profit calculations, billing).
 */

import db, {
    withDbOperation,
    auditEvents,
    eq, and, desc
} from "@repo/db";
import { createId } from "@paralleldrive/cuid2";

export interface AuditLogParams {
    organizationId: string;
    eventType: string;
    aggregateType: 'promo_code' | 'campaign' | 'customer' | 'product' | 'purchase_order';
    aggregateId: string;
    eventData: Record<string, any>;
    createdBy?: string;
}

export interface AuditEventQueryParams {
    organizationId: string;
    eventType?: string;
    aggregateType?: string;
    aggregateId?: string;
    limit?: number;
}

export const auditLogService = {
    /**
     * Log an audit event
     * 
     * IMMUTABLE - Events are never updated or deleted.
     * 
     * @param params - Event parameters
     * @returns Created audit event
     */
    async log(params: AuditLogParams) {
        const event = await withDbOperation({
            operation: "create",
            table: "audit_events",
            context: { organizationId: params.organizationId }
        }, () => db
            .insert(auditEvents)
            .values({
                id: createId(),
                organizationId: params.organizationId,
                eventType: params.eventType,
                aggregateType: params.aggregateType,
                aggregateId: params.aggregateId,
                eventData: params.eventData,
                createdBy: params.createdBy || null,
                createdAt: new Date(),
            })
            .returning()
            .then(rows => rows[0])
        );

        return event;
    },

    /**
     * Get audit history for a specific aggregate
     * 
     * @param aggregateId - ID of aggregate to get history for
     * @param organizationId - Organization context
     * @returns Ordered list of events (newest first)
     */
    async getHistory(aggregateId: string, organizationId: string) {
        return await withDbOperation({
            operation: "findMany",
            table: "audit_events",
            context: { organizationId, aggregateId }
        }, () => db
            .select()
            .from(auditEvents)
            .where(and(
                eq(auditEvents.aggregateId, aggregateId),
                eq(auditEvents.organizationId, organizationId)
            ))
            .orderBy(desc(auditEvents.createdAt))
        );
    },

    /**
     * Query audit events with filters
     * 
     * @param params - Query parameters
     * @returns Filtered events
     */
    async query(params: AuditEventQueryParams) {
        const filters = [eq(auditEvents.organizationId, params.organizationId)];

        if (params.eventType) {
            filters.push(eq(auditEvents.eventType, params.eventType));
        }

        if (params.aggregateType) {
            filters.push(eq(auditEvents.aggregateType, params.aggregateType));
        }

        if (params.aggregateId) {
            filters.push(eq(auditEvents.aggregateId, params.aggregateId));
        }

        return await withDbOperation({
            operation: "findMany",
            table: "audit_events",
            context: { organizationId: params.organizationId }
        }, () => {
            let query = db
                .select()
                .from(auditEvents)
                .where(and(...filters))
                .orderBy(desc(auditEvents.createdAt));

            if (params.limit) {
                query = query.limit(params.limit) as any;
            }

            return query;
        });
    },

    /**
     * Get events by type
     * 
     * Useful for querying specific event streams (e.g., all 'promo.redeemed')
     */
    async getEventsByType(eventType: string, organizationId: string, limit = 100) {
        return await this.query({
            organizationId,
            eventType,
            limit,
        });
    },
};
