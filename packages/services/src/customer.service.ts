import { createError } from "@repo/utils";
import db, {
    withDbOperation,
    customers,
    eq, and, or, sql, count, sum, desc, asc, ilike, gte, lte
} from "@repo/db";

import type {
    CustomerCreate,
    CustomerUpdate,
    CustomerListQuery,
    CustomerResponse,
    CustomerListResponse,
    CustomerAgeVerification,
    CustomerOptIn,
    CustomerOptOut,
    CustomerStats,
    BulkCustomerImport,
    BulkCustomerImportResponse,
} from "@repo/schema";

export const customerService = {
    /**
     * Create a single customer
     * 
     * @param data - Customer creation data
     * @param organizationId - Organization context
     * @returns Created customer
     */
    async createCustomer(
        data: CustomerCreate,
        organizationId: string
    ): Promise<CustomerResponse> {
        // Check for duplicate phone number in this organization
        const existing = await withDbOperation({
            operation: "findUnique",
            table: "customer",
            context: { organizationId, phoneNumber: data.phoneNumber }
        }, () => db
            .select()
            .from(customers)
            .where(and(
                eq(customers.phoneNumber, data.phoneNumber),
                eq(customers.organizationId, organizationId)
            ))
            .limit(1)
            .then(rows => rows[0])
        );

        if (existing) {
            throw createError.businessRule("duplicate_customer", {
                phoneNumber: data.phoneNumber,
                message: "Customer with this phone number already exists"
            });
        }

        // Create customer
        const [customer] = await withDbOperation({
            operation: "create",
            table: "customer",
            context: { organizationId }
        }, () => db
            .insert(customers)
            .values({
                organizationId,
                phoneNumber: data.phoneNumber,
                name: data.name ?? null,
                email: data.email ?? null,
                hasOptedIn: data.hasOptedIn ?? false,
                optInSource: data.optInSource ?? null,
                optInCampaignId: data.optInCampaignId ?? null,
                optedInAt: data.hasOptedIn ? new Date() : null,
                tier: data.tier ?? 'bronze',
                city: data.city ?? null,
                tags: data.tags ?? [],
                customFields: data.customFields ?? null,
            })
            .returning()
        );

        return customer as CustomerResponse;
    },

    /**
     * Bulk import customers (CSV upload)
     * 
     * @param data - Bulk import data
     * @param organizationId - Organization context
     * @returns Import results
     */
    async bulkImport(
        data: BulkCustomerImport,
        organizationId: string
    ): Promise<BulkCustomerImportResponse> {
        const results = {
            success: true,
            imported: 0,
            skipped: 0,
            errors: [] as Array<{ index: number; phoneNumber: string; error: string }>
        };

        // Get existing phone numbers to detect duplicates
        const existingPhones = await withDbOperation({
            operation: "findMany",
            table: "customer",
            context: { organizationId }
        }, () => db
            .select({ phoneNumber: customers.phoneNumber })
            .from(customers)
            .where(eq(customers.organizationId, organizationId))
        );

        const existingPhoneSet = new Set(existingPhones.map(row => row.phoneNumber));

        // Process each customer
        for (let i = 0; i < data.customers.length; i++) {
            const customerData = data.customers[i];

            try {
                // Check for duplicates
                if (existingPhoneSet.has(customerData.phoneNumber)) {
                    if (data.skipDuplicates) {
                        results.skipped++;
                        continue;
                    } else {
                        throw new Error("Duplicate phone number");
                    }
                }

                // Insert customer
                await db.insert(customers).values({
                    organizationId,
                    phoneNumber: customerData.phoneNumber,
                    name: customerData.name ?? null,
                    email: customerData.email ?? null,
                    hasOptedIn: customerData.hasOptedIn ?? false,
                    optInSource: customerData.optInSource ?? null,
                    optInCampaignId: customerData.optInCampaignId ?? null,
                    optedInAt: customerData.hasOptedIn ? new Date() : null,
                    tier: customerData.tier ?? 'bronze',
                    city: customerData.city ?? null,
                    tags: customerData.tags ?? [],
                    customFields: customerData.customFields ?? null,
                });

                existingPhoneSet.add(customerData.phoneNumber);
                results.imported++;
            } catch (error) {
                results.errors.push({
                    index: i,
                    phoneNumber: customerData.phoneNumber,
                    error: error instanceof Error ? error.message : "Unknown error"
                });
            }
        }

        return results;
    },

    /**
     * Get customer by ID
     * 
     * @param customerId - Customer ID
     * @param organizationId - Organization context
     * @returns Customer data
     */
    async getById(
        customerId: string,
        organizationId: string
    ): Promise<CustomerResponse> {
        const customer = await withDbOperation({
            operation: "findUnique",
            table: "customer",
            context: { organizationId, customerId }
        }, () => db
            .select()
            .from(customers)
            .where(and(
                eq(customers.id, customerId),
                eq(customers.organizationId, organizationId)
            ))
            .limit(1)
            .then(rows => rows[0])
        );

        if (!customer) {
            throw createError.notFound("Customer", { customerId, organizationId });
        }

        return customer as CustomerResponse;
    },

    /**
     * Update customer
     * 
     * @param customerId - Customer ID
     * @param data - Update data
     * @param organizationId - Organization context
     * @returns Updated customer
     */
    async updateCustomer(
        customerId: string,
        data: CustomerUpdate,
        organizationId: string
    ): Promise<CustomerResponse> {
        // Verify customer exists
        await this.getById(customerId, organizationId);

        // If phone number is being updated, check for duplicates
        if (data.phoneNumber) {
            const existing = await db
                .select()
                .from(customers)
                .where(and(
                    eq(customers.phoneNumber, data.phoneNumber),
                    eq(customers.organizationId, organizationId),
                    sql`${customers.id} != ${customerId}`
                ))
                .limit(1)
                .then(rows => rows[0]);

            if (existing) {
                throw createError.businessRule("duplicate_customer", {
                    phoneNumber: data.phoneNumber,
                    message: "Customer with this phone number already exists"
                });
            }
        }

        const [updated] = await withDbOperation({
            operation: "update",
            table: "customer",
            context: { organizationId, customerId }
        }, () => db
            .update(customers)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(and(
                eq(customers.id, customerId),
                eq(customers.organizationId, organizationId)
            ))
            .returning()
        );

        return updated as CustomerResponse;
    },

    /**
     * Delete customer (soft delete by marking inactive)
     * 
     * @param customerId - Customer ID
     * @param organizationId - Organization context
     */
    async deleteCustomer(
        customerId: string,
        organizationId: string
    ): Promise<{ success: boolean }> {
        // Verify customer exists
        await this.getById(customerId, organizationId);

        await withDbOperation({
            operation: "delete",
            table: "customer",
            context: { organizationId, customerId }
        }, () => db
            .delete(customers)
            .where(and(
                eq(customers.id, customerId),
                eq(customers.organizationId, organizationId)
            ))
        );

        return { success: true };
    },

    /**
     * Verify customer age (COMPLIANCE GOLD)
     * 
     * @param customerId - Customer ID
     * @param data - Verification data
     * @param organizationId - Organization context
     * @returns Updated customer
     */
    async verifyAge(
        customerId: string,
        data: CustomerAgeVerification,
        organizationId: string
    ): Promise<CustomerResponse> {
        const [updated] = await withDbOperation({
            operation: "update",
            table: "customer",
            context: { organizationId, customerId }
        }, () => db
            .update(customers)
            .set({
                isAgeVerified: true,
                ageVerificationMethod: data.verificationMethod,
                ageVerifiedAt: new Date(),
                dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
                updatedAt: new Date(),
            })
            .where(and(
                eq(customers.id, customerId),
                eq(customers.organizationId, organizationId)
            ))
            .returning()
        );

        if (!updated) {
            throw createError.notFound("Customer", { customerId, organizationId });
        }

        return updated as CustomerResponse;
    },

    /**
     * Customer opt-in
     * 
     * @param customerId - Customer ID
     * @param data - Opt-in data
     * @param organizationId - Organization context
     * @returns Updated customer
     */
    async optIn(
        customerId: string,
        data: CustomerOptIn,
        organizationId: string
    ): Promise<CustomerResponse> {
        const [updated] = await withDbOperation({
            operation: "update",
            table: "customer",
            context: { organizationId, customerId }
        }, () => db
            .update(customers)
            .set({
                hasOptedIn: true,
                optInSource: data.optInSource ?? null,
                optInCampaignId: data.campaignId ?? null,
                optedInAt: new Date(),
                optedOutAt: null, // Clear opt-out if previously opted out
                updatedAt: new Date(),
            })
            .where(and(
                eq(customers.id, customerId),
                eq(customers.organizationId, organizationId)
            ))
            .returning()
        );

        if (!updated) {
            throw createError.notFound("Customer", { customerId, organizationId });
        }

        return updated as CustomerResponse;
    },

    /**
     * Customer opt-out
     * 
     * @param customerId - Customer ID
     * @param data - Opt-out data
     * @param organizationId - Organization context
     * @returns Updated customer
     */
    async optOut(
        customerId: string,
        data: CustomerOptOut,
        organizationId: string
    ): Promise<CustomerResponse> {
        const [updated] = await withDbOperation({
            operation: "update",
            table: "customer",
            context: { organizationId, customerId }
        }, () => db
            .update(customers)
            .set({
                hasOptedIn: false,
                optedOutAt: new Date(),
                updatedAt: new Date(),
            })
            .where(and(
                eq(customers.id, customerId),
                eq(customers.organizationId, organizationId)
            ))
            .returning()
        );

        if (!updated) {
            throw createError.notFound("Customer", { customerId, organizationId });
        }

        return updated as CustomerResponse;
    },

    /**
     * List customers with filters and pagination
     * 
     * @param query - Query parameters
     * @param organizationId - Organization context
     * @returns Paginated customer list
     */
    async listCustomers(
        query: CustomerListQuery,
        organizationId: string
    ): Promise<CustomerListResponse> {
        const {
            page = 1,
            limit = 20,
            search,
            tier,
            hasOptedIn,
            isAgeVerified,
            city,
            tags,
            minTotalSpend,
            lastOrderDaysAgo,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = query;

        // Build filters
        const filters = [eq(customers.organizationId, organizationId)];

        if (search) {
            filters.push(
                or(
                    ilike(customers.name, `%${search}%`),
                    ilike(customers.phoneNumber, `%${search}%`),
                    ilike(customers.email, `%${search}%`)
                )!
            );
        }

        if (tier) {
            filters.push(eq(customers.tier, tier));
        }

        if (hasOptedIn !== undefined) {
            filters.push(eq(customers.hasOptedIn, hasOptedIn));
        }

        if (isAgeVerified !== undefined) {
            filters.push(eq(customers.isAgeVerified, isAgeVerified));
        }

        if (city) {
            filters.push(eq(customers.city, city));
        }

        if (minTotalSpend !== undefined) {
            filters.push(gte(customers.totalSpend, minTotalSpend));
        }

        if (lastOrderDaysAgo !== undefined) {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - lastOrderDaysAgo);
            filters.push(gte(customers.lastOrderAt, cutoffDate));
        }

        // Get total count
        const totalResult = await withDbOperation({
            operation: "count",
            table: "customer",
            context: { organizationId }
        }, () => db
            .select({ count: count() })
            .from(customers)
            .where(and(...filters))
            .then(rows => rows[0])
        );

        const total = totalResult?.count || 0;

        // Get paginated data
        const offset = (page - 1) * limit;
        const orderFn = sortOrder === 'asc' ? asc : desc;

        // Map sortBy to column
        let orderByColumn = customers.createdAt;
        if (sortBy === 'name') orderByColumn = customers.name;
        else if (sortBy === 'phoneNumber') orderByColumn = customers.phoneNumber;
        else if (sortBy === 'totalSpend') orderByColumn = customers.totalSpend;
        else if (sortBy === 'totalOrders') orderByColumn = customers.totalOrders;
        else if (sortBy === 'lastOrderAt') orderByColumn = customers.lastOrderAt;

        const data = await withDbOperation({
            operation: "findMany",
            table: "customer",
            context: { organizationId }
        }, () => db
            .select()
            .from(customers)
            .where(and(...filters))
            .orderBy(orderFn(orderByColumn))
            .limit(limit)
            .offset(offset)
        );

        return {
            data: data as CustomerResponse[],
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    },

    /**
     * Get customer stats
     * 
     * @param organizationId - Organization context
     * @returns Customer statistics
     */
    async getStats(organizationId: string): Promise<CustomerStats> {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const stats = await withDbOperation({
            operation: "findMany",
            table: "customer",
            context: { organizationId }
        }, () => db
            .select({
                totalCustomers: count(),
                optedInCustomers: count(sql`CASE WHEN ${customers.hasOptedIn} THEN 1 END`),
                ageVerifiedCustomers: count(sql`CASE WHEN ${customers.isAgeVerified} THEN 1 END`),
                activeCustomers: count(sql`CASE WHEN ${customers.lastOrderAt} >= ${thirtyDaysAgo} THEN 1 END`),
                totalLifetimeValue: sum(customers.attributedRevenue),
                totalOrders: sum(customers.totalOrders),
                totalSpend: sum(customers.totalSpend),
            })
            .from(customers)
            .where(eq(customers.organizationId, organizationId))
            .then(rows => rows[0])
        );

        // Get customers by tier
        const tierStats = await db
            .select({
                tier: customers.tier,
                count: count()
            })
            .from(customers)
            .where(eq(customers.organizationId, organizationId))
            .groupBy(customers.tier);

        const customersByTier: Record<string, number> = {};
        tierStats.forEach(row => {
            customersByTier[row.tier || 'bronze'] = row.count;
        });

        // Get customers by city
        const cityStats = await db
            .select({
                city: customers.city,
                count: count()
            })
            .from(customers)
            .where(eq(customers.organizationId, organizationId))
            .groupBy(customers.city);

        const customersByCity: Record<string, number> = {};
        cityStats.forEach(row => {
            if (row.city) {
                customersByCity[row.city] = row.count;
            }
        });

        const totalCustomers = stats?.totalCustomers || 0;
        const totalOrders = Number(stats?.totalOrders || 0);
        const totalSpend = Number(stats?.totalSpend || 0);

        return {
            totalCustomers,
            optedInCustomers: stats?.optedInCustomers || 0,
            ageVerifiedCustomers: stats?.ageVerifiedCustomers || 0,
            activeCustomers: stats?.activeCustomers || 0,
            customersByTier,
            customersByCity,
            totalLifetimeValue: Number(stats?.totalLifetimeValue || 0),
            avgOrderValue: totalOrders > 0 ? totalSpend / totalOrders : 0,
            avgOrdersPerCustomer: totalCustomers > 0 ? totalOrders / totalCustomers : 0,
        };
    },
};
