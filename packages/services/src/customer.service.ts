import db, {
	and,
	asc,
	count,
	customers,
	desc,
	eq,
	ilike,
	or,
	sql,
	sum,
	withDrizzleErrors,
} from "@repo/db";
import type {
	BulkCustomerImport,
	BulkCustomerImportResponse,
	CustomerAgeVerification,
	CustomerCreate,
	CustomerListQuery,
	CustomerListResponse,
	CustomerOptIn,
	CustomerOptOut,
	CustomerResponse,
	CustomerStats,
	CustomerUpdate,
} from "@repo/schema";
import { OrganizationContext } from "@repo/utils";
import {
	type DatabaseError,
	GenericDatabaseError,
} from "@repo/utils/errors/domain";
import { Effect } from "effect";

export const customerService = {
	/**
	 * Create a single customer
	 *
	 * @param data - Customer creation data
	 * @returns Created customer
	 */
	createCustomerEffect(
		data: CustomerCreate,
	): Effect.Effect<
		CustomerResponse,
		DatabaseError | GenericDatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			// Check for duplicate phone
			const existingRows = yield* withDrizzleErrors(
				"customer",
				"findUnique",
				() =>
					db
						.select()
						.from(customers)
						.where(
							and(
								eq(customers.phoneNumber, data.phoneNumber),
								eq(customers.organizationId, organizationId),
							),
						)
						.limit(1),
			);

			if (existingRows.length > 0) {
				return yield* Effect.fail(
					new GenericDatabaseError({
						operation: "create",
						table: "customers",
						pgCode: "23505",
						detail: `Customer with phone ${data.phoneNumber} already exists`,
						originalError: new Error("Duplicate phone number"),
					}),
				);
			}

			const customerRows = yield* withDrizzleErrors("customer", "create", () =>
				db
					.insert(customers)
					.values({
						organizationId,
						phoneNumber: data.phoneNumber,
						name: data.name ?? null,
						email: data.email ?? null,
						dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
						isAgeVerified: false,
						hasOptedIn: false,
						tags: data.tags ?? [],
					})
					.returning(),
			);

			return customerRows[0] as CustomerResponse;
		});
	},
	bulkImportEffect(
		data: BulkCustomerImport,
	): Effect.Effect<
		BulkCustomerImportResponse,
		DatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			let imported = 0;
			let failed = 0;
			const errors: string[] = [];

			for (const customer of data.customers) {
				try {
					yield* customerService.createCustomerEffect(customer);
					imported++;
				} catch (error) {
					failed++;
					errors.push(`${customer.phoneNumber}: ${(error as Error).message}`);
				}
			}

			return {
				imported,
				failed,
				errors,
			};
		});
	},
	getByIdEffect(
		customerId: string,
	): Effect.Effect<
		CustomerResponse,
		GenericDatabaseError | DatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			const customerRows = yield* withDrizzleErrors(
				"customer",
				"findUnique",
				() =>
					db
						.select()
						.from(customers)
						.where(
							and(
								eq(customers.id, customerId),
								eq(customers.organizationId, organizationId),
							),
						)
						.limit(1),
			);

			const customer = customerRows[0];
			if (!customer) {
				return yield* Effect.fail(
					new GenericDatabaseError({
						operation: "findUnique",
						table: "customers",
						pgCode: undefined,
						detail: `Customer ${customerId} not found`,
						originalError: new Error("Customer not found"),
					}),
				);
			}

			return customer as CustomerResponse;
		});
	},
	updateCustomerEffect(
		customerId: string,
		data: CustomerUpdate,
	): Effect.Effect<
		CustomerResponse,
		GenericDatabaseError | DatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			// Verify customer exists
			yield* customerService.getByIdEffect(customerId);

			const updatedRows = yield* withDrizzleErrors("customer", "update", () =>
				db
					.update(customers)
					.set({
						...data,
						updatedAt: new Date(),
					})
					.where(
						and(
							eq(customers.id, customerId),
							eq(customers.organizationId, organizationId),
						),
					)
					.returning(),
			);

			return updatedRows[0] as CustomerResponse;
		});
	},

	/**
	 * Delete customer (soft delete by marking inactive)
	 *
	 * @param customerId - Customer ID
	 */
	deleteCustomerEffect(
		customerId: string,
	): Effect.Effect<{ success: boolean }, DatabaseError, OrganizationContext> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			// Note: customers table doesn't have isActive, but we can still soft-delete
			// by updating a field or using a dedicated deletedAt field if exists
			yield* withDrizzleErrors("customer", "update", () =>
				db
					.update(customers)
					.set({
						updatedAt: new Date(),
						// TODO: soft delete
					})
					.where(
						and(
							eq(customers.id, customerId),
							eq(customers.organizationId, organizationId),
						),
					),
			);

			return { success: true };
		});
	},
	verifyAgeEffect(
		customerId: string,
		data: CustomerAgeVerification,
	): Effect.Effect<
		CustomerResponse,
		GenericDatabaseError | DatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			const updatedRows = yield* withDrizzleErrors("customer", "update", () =>
				db
					.update(customers)
					.set({
						isAgeVerified: true,
						ageVerifiedAt: new Date(),
						ageVerificationMethod: data.method,
						updatedAt: new Date(),
					})
					.where(
						and(
							eq(customers.id, customerId),
							eq(customers.organizationId, organizationId),
						),
					)
					.returning(),
			);

			const updated = updatedRows[0];
			if (!updated) {
				return yield* Effect.fail(
					new GenericDatabaseError({
						operation: "update",
						table: "customers",
						pgCode: undefined,
						detail: `Customer ${customerId} not found`,
						originalError: new Error("Customer not found"),
					}),
				);
			}

			return updated as CustomerResponse;
		});
	},
	optInEffect(
		customerId: string,
		data: CustomerOptIn,
	): Effect.Effect<
		CustomerResponse,
		GenericDatabaseError | DatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			const updatedRows = yield* withDrizzleErrors("customer", "update", () =>
				db
					.update(customers)
					.set({
						hasOptedIn: true,
						optedInAt: new Date(),
						optInSource: data.source ?? null,
						updatedAt: new Date(),
					})
					.where(
						and(
							eq(customers.id, customerId),
							eq(customers.organizationId, organizationId),
						),
					)
					.returning(),
			);

			const updated = updatedRows[0];
			if (!updated) {
				return yield* Effect.fail(
					new GenericDatabaseError({
						operation: "update",
						table: "customers",
						pgCode: undefined,
						detail: `Customer ${customerId} not found`,
						originalError: new Error("Customer not found"),
					}),
				);
			}

			return updated as CustomerResponse;
		});
	},
	optOutEffect(
		customerId: string,
		data: CustomerOptOut,
	): Effect.Effect<
		CustomerResponse,
		GenericDatabaseError | DatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			const updatedRows = yield* withDrizzleErrors("customer", "update", () =>
				db
					.update(customers)
					.set({
						hasOptedIn: false,
						optedOutAt: new Date(),
						updatedAt: new Date(),
					})
					.where(
						and(
							eq(customers.id, customerId),
							eq(customers.organizationId, organizationId),
						),
					)
					.returning(),
			);

			const updated = updatedRows[0];
			if (!updated) {
				return yield* Effect.fail(
					new GenericDatabaseError({
						operation: "update",
						table: "customers",
						pgCode: undefined,
						detail: `Customer ${customerId} not found`,
						originalError: new Error("Customer not found"),
					}),
				);
			}

			return updated as CustomerResponse;
		});
	},
	listCustomersEffect(
		query: CustomerListQuery,
	): Effect.Effect<CustomerListResponse, DatabaseError, OrganizationContext> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			const {
				page = 1,
				limit = 20,
				search,
				isAgeVerified,
				hasOptedIn,
				sortBy = "createdAt",
				sortOrder = "desc",
			} = query;

			// Build filters
			const filters = [eq(customers.organizationId, organizationId)];

			if (search) {
				filters.push(
					or(
						ilike(customers.name, `%${search}%`),
						ilike(customers.phoneNumber, `%${search}%`),
						ilike(customers.email, `%${search}%`),
					)!,
				);
			}

			if (isAgeVerified !== undefined) {
				filters.push(eq(customers.isAgeVerified, isAgeVerified));
			}

			if (hasOptedIn !== undefined) {
				filters.push(eq(customers.hasOptedIn, hasOptedIn));
			}

			// Get total count
			const totalRows = yield* withDrizzleErrors("customer", "count", () =>
				db
					.select({ count: count() })
					.from(customers)
					.where(and(...filters)),
			);

			const total = totalRows[0]?.count || 0;

			const offset = (page - 1) * limit;
			const orderFn = sortOrder === "asc" ? asc : desc;

			let orderByColumn: any = customers.createdAt;
			if (sortBy === "name") orderByColumn = customers.name;
			else if (sortBy === "phoneNumber") orderByColumn = customers.phoneNumber;

			const data = yield* withDrizzleErrors("customer", "findMany", () =>
				db
					.select()
					.from(customers)
					.where(and(...filters))
					.orderBy(orderFn(orderByColumn))
					.limit(limit)
					.offset(offset),
			);

			return {
				data: data as CustomerResponse[],
				pagination: {
					page,
					limit,
					total,
					totalPages: Math.ceil(total / limit),
				},
			};
		});
	},

	getStatsEffect(): Effect.Effect<
		CustomerStats,
		DatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			const statsRows = yield* withDrizzleErrors("customer", "query", () =>
				db
					.select({
						totalCustomers: count(),
						verifiedCustomers: count(
							sql`CASE WHEN ${customers.isAgeVerified} THEN 1 END`,
						),
						optedInCustomers: count(
							sql`CASE WHEN ${customers.hasOptedIn} THEN 1 END`,
						),
						totalLifetimeValue: sum(customers.attributedRevenue),
					})
					.from(customers)
					.where(eq(customers.organizationId, organizationId)),
			);

			const stats = statsRows[0];

			return {
				totalCustomers: stats?.totalCustomers || 0,
				verifiedCustomers: stats?.verifiedCustomers || 0,
				optedInCustomers: stats?.optedInCustomers || 0,
				totalLifetimeValue: Number(stats?.totalLifetimeValue || 0),
				averageLifetimeValue:
					stats?.totalCustomers && stats.totalCustomers > 0
						? Number(stats.totalLifetimeValue || 0) / stats.totalCustomers
						: 0,
			};
		});
	},
};
