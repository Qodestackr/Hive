import { createId } from "@paralleldrive/cuid2";
import db, { and, auditEvents, desc, eq, withDrizzleErrors } from "@repo/db";
import { OrganizationContext } from "@repo/utils";
import type { DatabaseError } from "@repo/utils/errors/domain";
import { Effect } from "effect";

export interface AuditLogParams {
	eventType: string;
	aggregateType:
		| "promo_code"
		| "campaign"
		| "customer"
		| "product"
		| "purchase_order";
	aggregateId: string;
	eventData: Record<string, any>;
	createdBy?: string;
}

export interface AuditEventQueryParams {
	eventType?: string;
	aggregateType?: string;
	aggregateId?: string;
	limit?: number;
}

// logging and querying immutable audit events.
// for trust-critical operations (profit calculations, billing).
export const auditLogService = {
	/**
	 * Log an audit event
	 *
	 * IMMUTABLE - Events are never updated or deleted.
	 *
	 * @param params - Event parameters
	 * @returns Created audit event
	 */
	logEffect(
		params: AuditLogParams,
	): Effect.Effect<any, DatabaseError, OrganizationContext> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			const eventRows = yield* withDrizzleErrors("audit_events", "create", () =>
				db
					.insert(auditEvents)
					.values({
						id: createId(),
						organizationId,
						eventType: params.eventType,
						aggregateType: params.aggregateType,
						aggregateId: params.aggregateId,
						eventData: params.eventData,
						createdBy: params.createdBy || null,
						createdAt: new Date(),
					})
					.returning(),
			);

			return eventRows[0];
		});
	},

	/**
	 * Get audit history for a specific aggregate
	 *
	 * @param aggregateId - ID of aggregate to get history for
	 * @returns Ordered list of events (newest first)
	 */
	getHistoryEffect(
		aggregateId: string,
	): Effect.Effect<any[], DatabaseError, OrganizationContext> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			return yield* withDrizzleErrors("audit_events", "findMany", () =>
				db
					.select()
					.from(auditEvents)
					.where(
						and(
							eq(auditEvents.aggregateId, aggregateId),
							eq(auditEvents.organizationId, organizationId),
						),
					)
					.orderBy(desc(auditEvents.createdAt)),
			);
		});
	},

	/**
	 * Query audit events with filters
	 *
	 * @param params - Query parameters
	 * @returns Filtered events
	 */
	queryEffect(
		params: AuditEventQueryParams,
	): Effect.Effect<any[], DatabaseError, OrganizationContext> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			const filters = [eq(auditEvents.organizationId, organizationId)];

			if (params.eventType) {
				filters.push(eq(auditEvents.eventType, params.eventType));
			}

			if (params.aggregateType) {
				filters.push(eq(auditEvents.aggregateType, params.aggregateType));
			}

			if (params.aggregateId) {
				filters.push(eq(auditEvents.aggregateId, params.aggregateId));
			}

			return yield* withDrizzleErrors("audit_events", "findMany", () => {
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
		});
	},

	/**
	 * Get events by type
	 *
	 * Useful for querying specific event streams (e.g., all 'promo.redeemed')
	 */
	getEventsByTypeEffect(
		eventType: string,
		limit = 100,
	): Effect.Effect<any[], DatabaseError, OrganizationContext> {
		return auditLogService.queryEffect({
			eventType,
			limit,
		});
	},

	// Legacy Promise-based method for backward compatibility
	// Will be removed once all callers are updated
	async log(params: AuditLogParams & { organizationId: string }) {
		const event = await db
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
			.then((rows) => rows[0]);

		return event;
	},
};
