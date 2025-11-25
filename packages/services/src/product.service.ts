import { createError } from "@repo/utils";
import db, {
    withDbOperation,
    products,
    inventoryMovements,
    eq, and, or, sql, count, sum, desc, asc, ilike
} from "@repo/db";

import type {
    ProductCreate,
    ProductUpdate,
    ProductListQuery,
    ProductResponse,
    ProductListResponse,
    ProductPriceUpdate,
    BulkProductPriceUpdate,
} from "@repo/schema";

export const productService = {
    /**
     * Create a product
     * 
     * @param data - Product creation data
     * @param organizationId - Organization context
     * @returns Created product
     */
    async createProduct(
        data: ProductCreate,
        organizationId: string
    ): Promise<ProductResponse> {
        // Check for duplicate SKU in this organization
        const existing = await withDbOperation({
            operation: "findUnique",
            table: "product",
            context: { organizationId, sku: data.sku }
        }, () => db
            .select()
            .from(products)
            .where(and(
                eq(products.sku, data.sku),
                eq(products.organizationId, organizationId)
            ))
            .limit(1)
            .then(rows => rows[0])
        );

        if (existing) {
            throw createError.businessRule("duplicate_sku", {
                sku: data.sku,
                message: "Product with this SKU already exists"
            });
        }

        // Create product
        const [product] = await withDbOperation({
            operation: "create",
            table: "product",
            context: { organizationId }
        }, () => db
            .insert(products)
            .values({
                organizationId,
                name: data.name,
                sku: data.sku,
                category: data.category ?? null,
                description: data.description ?? null,
                basePrice: data.basePrice,
                saleorProductId: data.saleorProductId ?? null,
                saleorVariantId: data.saleorVariantId ?? null,
                alcoholContent: data.alcoholContent ?? null,
                requiresAgeVerification: data.requiresAgeVerification ?? true,
                images: data.images ?? null,
                tags: data.tags ?? [],
                isActive: true,
            })
            .returning()
        );

        return product as ProductResponse;
    },

    /**
     * Get product by ID
     * 
     * @param productId - Product ID
     * @param organizationId - Organization context
     * @returns Product data
     */
    async getById(
        productId: string,
        organizationId: string
    ): Promise<ProductResponse> {
        const product = await withDbOperation({
            operation: "findUnique",
            table: "product",
            context: { organizationId, productId }
        }, () => db
            .select()
            .from(products)
            .where(and(
                eq(products.id, productId),
                eq(products.organizationId, organizationId)
            ))
            .limit(1)
            .then(rows => rows[0])
        );

        if (!product) {
            throw createError.notFound("Product", { productId, organizationId });
        }

        return product as ProductResponse;
    },

    /**
     * Update product
     * 
     * @param productId - Product ID
     * @param data - Update data
     * @param organizationId - Organization context
     * @returns Updated product
     */
    async updateProduct(
        productId: string,
        data: ProductUpdate,
        organizationId: string
    ): Promise<ProductResponse> {
        // Verify product exists
        await this.getById(productId, organizationId);

        // If SKU is being updated, check for duplicates
        if (data.sku) {
            const existing = await db
                .select()
                .from(products)
                .where(and(
                    eq(products.sku, data.sku),
                    eq(products.organizationId, organizationId),
                    sql`${products.id} != ${productId}`
                ))
                .limit(1)
                .then(rows => rows[0]);

            if (existing) {
                throw createError.businessRule("duplicate_sku", {
                    sku: data.sku,
                    message: "Product with this SKU already exists"
                });
            }
        }

        const [updated] = await withDbOperation({
            operation: "update",
            table: "product",
            context: { organizationId, productId }
        }, () => db
            .update(products)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(and(
                eq(products.id, productId),
                eq(products.organizationId, organizationId)
            ))
            .returning()
        );

        return updated as ProductResponse;
    },

    /**
     * Delete product (soft delete by marking inactive)
     * 
     * @param productId - Product ID
     * @param organizationId - Organization context
     */
    async deleteProduct(
        productId: string,
        organizationId: string
    ): Promise<{ success: boolean }> {
        // Mark as inactive instead of hard delete
        await withDbOperation({
            operation: "update",
            table: "product",
            context: { organizationId, productId }
        }, () => db
            .update(products)
            .set({
                isActive: false,
                updatedAt: new Date(),
            })
            .where(and(
                eq(products.id, productId),
                eq(products.organizationId, organizationId)
            ))
        );

        return { success: true };
    },

    /**
     * Quick price update (for onboarding)
     * 
     * @param productId - Product ID
     * @param data - Price update data
     * @param organizationId - Organization context
     * @returns Updated product
     */
    async updatePrice(
        productId: string,
        data: ProductPriceUpdate,
        organizationId: string
    ): Promise<ProductResponse> {
        const [updated] = await withDbOperation({
            operation: "update",
            table: "product",
            context: { organizationId, productId }
        }, () => db
            .update(products)
            .set({
                basePrice: data.basePrice,
                currentStockQuantity: data.currentStockQuantity,
                updatedAt: new Date(),
            })
            .where(and(
                eq(products.id, productId),
                eq(products.organizationId, organizationId)
            ))
            .returning()
        );

        if (!updated) {
            throw createError.notFound("Product", { productId, organizationId });
        }

        return updated as ProductResponse;
    },

    /**
     * Bulk price update
     * 
     * @param data - Bulk update data
     * @param organizationId - Organization context
     * @returns Number of updated products
     */
    async bulkPriceUpdate(
        data: BulkProductPriceUpdate,
        organizationId: string
    ): Promise<{ updated: number }> {
        let updated = 0;

        for (const update of data.updates) {
            try {
                await db
                    .update(products)
                    .set({
                        basePrice: update.basePrice,
                        currentStockQuantity: update.currentStockQuantity,
                        updatedAt: new Date(),
                    })
                    .where(and(
                        eq(products.id, update.productId),
                        eq(products.organizationId, organizationId)
                    ));
                updated++;
            } catch (error) {
                // Continue with other updates even if one fails
                console.error(`Failed to update product ${update.productId}:`, error);
            }
        }

        return { updated };
    },

    /**
     * List products with filters and pagination
     * 
     * @param query - Query parameters
     * @param organizationId - Organization context
     * @returns Paginated product list
     */
    async listProducts(
        query: ProductListQuery,
        organizationId: string
    ): Promise<ProductListResponse> {
        const {
            page = 1,
            limit = 20,
            search,
            category,
            isActive,
            isSlowMover,
            sortBy = 'name',
            sortOrder = 'asc'
        } = query;

        // Build filters
        const filters = [eq(products.organizationId, organizationId)];

        if (search) {
            filters.push(
                or(
                    ilike(products.name, `%${search}%`),
                    ilike(products.sku, `%${search}%`)
                )!
            );
        }

        if (category) {
            filters.push(eq(products.category, category));
        }

        if (isActive !== undefined) {
            filters.push(eq(products.isActive, isActive));
        }

        if (isSlowMover !== undefined) {
            filters.push(eq(products.isSlowMover, isSlowMover));
        }

        // Get total count
        const totalResult = await withDbOperation({
            operation: "count",
            table: "product",
            context: { organizationId }
        }, () => db
            .select({ count: count() })
            .from(products)
            .where(and(...filters))
            .then(rows => rows[0])
        );

        const total = totalResult?.count || 0;

        // Get paginated data
        const offset = (page - 1) * limit;
        const orderFn = sortOrder === 'asc' ? asc : desc;

        // Map sortBy to column
        let orderByColumn = products.name;
        if (sortBy === 'sku') orderByColumn = products.sku;
        else if (sortBy === 'basePrice') orderByColumn = products.basePrice;
        else if (sortBy === 'currentStockQuantity') orderByColumn = products.currentStockQuantity;
        else if (sortBy === 'createdAt') orderByColumn = products.createdAt;

        const data = await withDbOperation({
            operation: "findMany",
            table: "product",
            context: { organizationId }
        }, () => db
            .select()
            .from(products)
            .where(and(...filters))
            .orderBy(orderFn(orderByColumn))
            .limit(limit)
            .offset(offset)
        );

        return {
            data: data as ProductResponse[],
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    },

    /**
     * Get FIFO batches for a product (debugging)
     * 
     * Shows inventory movements for a product.
     * Useful for understanding inventory flow.
     * 
     * @param productId - Product ID
     * @param organizationId - Organization context
     * @returns Inventory movements
     */
    async getFIFOBatches(
        productId: string,
        organizationId: string
    ) {
        // Verify product exists
        await this.getById(productId, organizationId);

        // Get all IN movements
        const batches = await withDbOperation({
            operation: "findMany",
            table: "inventory_movement",
            context: { organizationId, productId }
        }, () => db
            .select({
                id: inventoryMovements.id,
                movementType: inventoryMovements.movementType,
                quantity: inventoryMovements.quantity,
                unitCostAtMovement: inventoryMovements.unitCostAtMovement,
                totalCost: inventoryMovements.totalCost,
                fifoBatchId: inventoryMovements.fifoBatchId,
                stockAfterMovement: inventoryMovements.stockAfterMovement,
                createdAt: inventoryMovements.createdAt,
            })
            .from(inventoryMovements)
            .where(and(
                eq(inventoryMovements.productId, productId),
                eq(inventoryMovements.organizationId, organizationId),
                eq(inventoryMovements.movementType, 'IN')
            ))
            .orderBy(asc(inventoryMovements.createdAt)) // FIFO order
        );

        return {
            productId,
            batches,
            totalQuantity: batches.reduce((sum, b) => sum + (b.quantity || 0), 0)
        };
    },
};
