import db, {
	and,
	asc,
	count,
	desc,
	eq,
	ilike,
	inventoryMovements,
	or,
	products,
	sql,
	withDrizzleErrors,
} from "@repo/db";
import type {
	BulkProductPriceUpdate,
	ProductCreate,
	ProductListQuery,
	ProductListResponse,
	ProductPriceUpdate,
	ProductResponse,
	ProductUpdate,
} from "@repo/schema";
import { OrganizationContext } from "@repo/utils";
import {
	type DatabaseError,
	GenericDatabaseError,
	ProductNotFound,
} from "@repo/utils/errors/domain";
import { Effect } from "effect";

export const productService = {
	/**
	 * Create a product
	 *
	 * @param data - Product creation data
	 * @returns Created product
	 */
	createProductEffect(
		data: ProductCreate,
	): Effect.Effect<
		ProductResponse,
		DatabaseError | GenericDatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			// Check for duplicate SKU in this organization
			const existingRows = yield* withDrizzleErrors(
				"product",
				"findUnique",
				() =>
					db
						.select()
						.from(products)
						.where(
							and(
								eq(products.sku, data.sku),
								eq(products.organizationId, organizationId),
							),
						)
						.limit(1),
			);

			if (existingRows.length > 0) {
				return yield* Effect.fail(
					new GenericDatabaseError({
						operation: "create",
						table: "products",
						pgCode: "23505",
						detail: `Product with SKU ${data.sku} already exists`,
						originalError: new Error("Duplicate SKU"),
					}),
				);
			}

			// Create product
			const productRows = yield* withDrizzleErrors("product", "create", () =>
				db
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
					.returning(),
			);

			return productRows[0] as ProductResponse;
		});
	},

	/**
	 * Get product by ID
	 *
	 * @param productId - Product ID
	 * @returns Product data
	 */
	getByIdEffect(
		productId: string,
	): Effect.Effect<
		ProductResponse,
		ProductNotFound | DatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			const productRows = yield* withDrizzleErrors(
				"product",
				"findUnique",
				() =>
					db
						.select()
						.from(products)
						.where(
							and(
								eq(products.id, productId),
								eq(products.organizationId, organizationId),
							),
						)
						.limit(1),
			);

			const product = productRows[0];
			if (!product) {
				return yield* Effect.fail(
					new ProductNotFound({ productId, organizationId }),
				);
			}

			return product as ProductResponse;
		});
	},

	/**
	 * Update product
	 *
	 * @param productId - Product ID
	 * @param data - Update data
	 * @returns Updated product
	 */
	updateProductEffect(
		productId: string,
		data: ProductUpdate,
	): Effect.Effect<
		ProductResponse,
		ProductNotFound | DatabaseError | GenericDatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			// Verify product exists
			yield* productService.getByIdEffect(productId);

			// If SKU is being updated, check for duplicates
			if (data.sku) {
				const existingRows = yield* withDrizzleErrors(
					"product",
					"findUnique",
					() =>
						db
							.select()
							.from(products)
							.where(
								and(
									eq(products.sku, data.sku),
									eq(products.organizationId, organizationId),
									sql`${products.id} != ${productId}`,
								),
							)
							.limit(1),
				);

				if (existingRows.length > 0) {
					return yield* Effect.fail(
						new GenericDatabaseError({
							operation: "update",
							table: "products",
							pgCode: "23505",
							detail: `Product with SKU ${data.sku} already exists`,
							originalError: new Error("Duplicate SKU"),
						}),
					);
				}
			}

			const updatedRows = yield* withDrizzleErrors("product", "update", () =>
				db
					.update(products)
					.set({
						...data,
						updatedAt: new Date(),
					})
					.where(
						and(
							eq(products.id, productId),
							eq(products.organizationId, organizationId),
						),
					)
					.returning(),
			);

			return updatedRows[0] as ProductResponse;
		});
	},

	/**
	 * Delete product (soft delete by marking inactive)
	 *
	 * @param productId - Product ID
	 */
	deleteProductEffect(
		productId: string,
	): Effect.Effect<{ success: boolean }, DatabaseError, OrganizationContext> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			// Mark as inactive instead of hard delete
			yield* withDrizzleErrors("product", "update", () =>
				db
					.update(products)
					.set({
						isActive: false,
						updatedAt: new Date(),
					})
					.where(
						and(
							eq(products.id, productId),
							eq(products.organizationId, organizationId),
						),
					),
			);

			return { success: true };
		});
	},

	/**
	 * Quick price update (for onboarding)
	 *
	 * @param productId - Product ID
	 * @param data - Price update data
	 * @returns Updated product
	 */
	updatePriceEffect(
		productId: string,
		data: ProductPriceUpdate,
	): Effect.Effect<
		ProductResponse,
		ProductNotFound | DatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			const updatedRows = yield* withDrizzleErrors("product", "update", () =>
				db
					.update(products)
					.set({
						basePrice: data.basePrice,
						currentStockQuantity: data.currentStockQuantity,
						updatedAt: new Date(),
					})
					.where(
						and(
							eq(products.id, productId),
							eq(products.organizationId, organizationId),
						),
					)
					.returning(),
			);

			const updated = updatedRows[0];
			if (!updated) {
				return yield* Effect.fail(
					new ProductNotFound({ productId, organizationId }),
				);
			}

			return updated as ProductResponse;
		});
	},

	/**
	 * Bulk price update
	 *
	 * @param data - Bulk update data
	 * @returns Number of updated products
	 */
	bulkPriceUpdateEffect(
		data: BulkProductPriceUpdate,
	): Effect.Effect<
		{ updated: number },
		DatabaseError | GenericDatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;
			let updated = 0;

			for (const update of data.updates) {
				try {
					yield* withDrizzleErrors("product", "update", () =>
						db
							.update(products)
							.set({
								basePrice: update.basePrice,
								currentStockQuantity: update.currentStockQuantity,
								updatedAt: new Date(),
							})
							.where(
								and(
									eq(products.id, update.productId),
									eq(products.organizationId, organizationId),
								),
							),
					);
					updated++;
				} catch (error) {
					// Continue with other updates even if one fails
					console.error(`Failed to update product ${update.productId}:`, error);
				}
			}

			return { updated };
		});
	},

	/**
	 * List products with filters and pagination
	 *
	 * @param query - Query parameters
	 * @returns Paginated product list
	 */
	listProductsEffect(
		query: ProductListQuery,
	): Effect.Effect<ProductListResponse, DatabaseError, OrganizationContext> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			const {
				page = 1,
				limit = 20,
				search,
				category,
				isActive,
				isSlowMover,
				sortBy = "name",
				sortOrder = "asc",
			} = query;

			// Build filters
			const filters = [eq(products.organizationId, organizationId)];

			if (search) {
				filters.push(
					or(
						ilike(products.name, `%${search}%`),
						ilike(products.sku, `%${search}%`),
					)!,
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
			const totalRows = yield* withDrizzleErrors("product", "count", () =>
				db
					.select({ count: count() })
					.from(products)
					.where(and(...filters)),
			);

			const total = totalRows[0]?.count || 0;

			// Get paginated data
			const offset = (page - 1) * limit;
			const orderFn = sortOrder === "asc" ? asc : desc;

			// Map sortBy to column
			// Map sortBy to column (use type-safe column references)
			let orderByColumn: any = products.name;
			if (sortBy === "sku") orderByColumn = products.sku;
			else if (sortBy === "basePrice") orderByColumn = products.basePrice;
			else if (sortBy === "currentStockQuantity")
				orderByColumn = products.currentStockQuantity;
			else if (sortBy === "createdAt") orderByColumn = products.createdAt;

			const data = yield* withDrizzleErrors("product", "findMany", () =>
				db
					.select()
					.from(products)
					.where(and(...filters))
					.orderBy(orderFn(orderByColumn))
					.limit(limit)
					.offset(offset),
			);

			return {
				data: data as ProductResponse[],
				pagination: {
					page,
					limit,
					total,
					totalPages: Math.ceil(total / limit),
				},
			};
		});
	},

	/**
	 * Get FIFO batches for a product (debugging)
	 *
	 * Shows inventory movements for a product.
	 * Useful for understanding inventory flow.
	 *
	 * @param productId - Product ID
	 * @returns Inventory movements
	 */
	getFIFOBatchesEffect(productId: string): Effect.Effect<
		{
			productId: string;
			batches: any[];
			totalQuantity: number;
		},
		ProductNotFound | DatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			// Verify product exists
			yield* productService.getByIdEffect(productId);

			// Get all IN movements
			const batches = yield* withDrizzleErrors(
				"inventory_movement",
				"findMany",
				() =>
					db
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
						.where(
							and(
								eq(inventoryMovements.productId, productId),
								eq(inventoryMovements.organizationId, organizationId),
								eq(inventoryMovements.movementType, "IN"),
							),
						)
						.orderBy(asc(inventoryMovements.createdAt)), // FIFO order
			);

			return {
				productId,
				batches,
				totalQuantity: batches.reduce((sum, b) => sum + (b.quantity || 0), 0),
			};
		});
	},
};
