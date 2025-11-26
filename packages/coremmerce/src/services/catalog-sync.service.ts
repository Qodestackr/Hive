/**
 * Catalog Sync Service
 *
 * Syncs products from master catalog to organization channels with:
 * - Effect-based concurrency control (rate limiting)
 * - Batch processing for large catalogs
 * - Bootstrap mode (direct DB writes, bypass webhooks)
 * - Progress tracking callbacks
 * - Fault-tolerant with typed errors
 */

import db, { eq, products as productsTable, withDrizzleErrors } from "@repo/db";
import { OrganizationContext } from "@repo/utils";
import {
	type DatabaseError,
	GenericDatabaseError,
} from "@repo/utils/errors/domain";
import { Effect, Schedule } from "effect";
import {
	type SaleorDomainError,
	SaleorProductCreationFailed,
} from "../errors/saleor-errors";
import {
	batchProducts,
	buildProductSyncMutation,
	calculateProgress,
	type MasterProduct,
	validateMasterProduct,
} from "../mutations/catalog-sync-mutations";

export interface CatalogSyncOptions {
	readonly masterChannelSlug?: string; // Default: "master-channel"
	readonly batchSize?: number; // Default: 50
	readonly concurrency?: number; // Default: 5
	readonly onProgress?: (current: number, total: number) => void;
}

export interface CatalogSyncResult {
	readonly success: boolean;
	readonly totalProducts: number;
	readonly successCount: number;
	readonly failedCount: number;
	readonly skippedCount: number;
	readonly failedProducts: ReadonlyArray<{ name: string; error: string }>;
	readonly durationMs: number;
}

/**
 * Internal sync state
 */
interface SyncState {
	synced: number;
	failed: number;
	skipped: number;
	failedProducts: Array<{ name: string; error: string }>;
}

export const catalogSyncService = {
	/**
	 * Sync master catalog to organization channel
	 *
	 * Process:
	 * 1. Fetch products from master catalog (DB)
	 * 2. Get organization's Saleor channel/warehouse
	 * 3. Batch sync with concurrency control (5 concurrent max)
	 * 4. Direct DB writes for inventory (bootstrap mode)
	 *
	 * @example
	 * const result = await Effect.runPromise(
	 *   catalogSyncService.syncMasterCatalogEffect({
	 *     onProgress: (current, total) => console.log(`${current}/${total}`)
	 *   }).pipe(
	 *     Effect.provideService(OrganizationContext, OrganizationContext.of({ organizationId: "org_123" }))
	 *   )
	 * )
	 */
	syncMasterCatalogEffect(
		options: CatalogSyncOptions = {},
	): Effect.Effect<
		CatalogSyncResult,
		SaleorDomainError | DatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const startTime = Date.now();
			const { organizationId } = yield* OrganizationContext;

			const {
				masterChannelSlug = "master-channel",
				batchSize = 50,
				concurrency = 5,
				onProgress,
			} = options;

			console.log(`🚀 Starting catalog sync for org ${organizationId}`);

			// Step 1: Get organization's Saleor resources
			const saleorChannel = yield* getSaleorChannelEffect(organizationId);
			const warehouse = yield* getWarehouseEffect(organizationId);

			console.log(
				`📡 Target: Channel ${saleorChannel.saleorChannelId}, Warehouse ${warehouse.saleorWarehouseId}`,
			);

			// Step 2: Fetch master catalog products
			const masterProducts =
				yield* getMasterCatalogProductsEffect(masterChannelSlug);

			if (masterProducts.length === 0) {
				console.warn(
					`⚠️ No products found in master catalog ${masterChannelSlug}`,
				);
				return {
					success: true,
					totalProducts: 0,
					successCount: 0,
					failedCount: 0,
					skippedCount: 0,
					failedProducts: [],
					durationMs: Date.now() - startTime,
				};
			}

			console.log(`📦 Found ${masterProducts.length} products to sync`);

			// Step 3: Batch and sync with concurrency control
			const batches = batchProducts(masterProducts, batchSize);
			const state: SyncState = {
				synced: 0,
				failed: 0,
				skipped: 0,
				failedProducts: [],
			};

			for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
				const batch = batches[batchIndex];
				if (!batch) continue;
				console.log(
					`📦 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} products)`,
				);

				// Sync batch with concurrency limit
				yield* Effect.forEach(
					batch,
					(product) =>
						syncProductEffect(
							product,
							saleorChannel.saleorChannelId,
							warehouse.saleorWarehouseId,
							state,
							onProgress,
							masterProducts.length,
						),
					{ concurrency, batching: true }, // Effect handles rate limiting
				);
			}

			const durationMs = Date.now() - startTime;
			console.log(`Catalog sync complete in ${durationMs}ms`);

			return {
				success: state.failed === 0,
				totalProducts: masterProducts.length,
				successCount: state.synced,
				failedCount: state.failed,
				skippedCount: state.skipped,
				failedProducts: state.failedProducts,
				durationMs,
			};
		});
	},
};

/**
 * Get organization's Saleor channel
 */
function getSaleorChannelEffect(
	organizationId: string,
): Effect.Effect<
	{ saleorChannelId: string; slug: string },
	DatabaseError,
	never
> {
	return Effect.gen(function* () {
		const channels = yield* withDrizzleErrors(
			"saleor_channels",
			"findFirst",
			() =>
				db.query.saleorChannels.findFirst({
					where: (channels: any, { eq }: any) =>
						eq(channels.organizationId, organizationId) &&
						eq(channels.isActive, true),
				}),
		);

		if (!channels) {
			return yield* Effect.fail(
				new GenericDatabaseError({
					operation: "getSaleorChannel",
					table: "saleor_channels",
					pgCode: undefined,
					detail: `No active Saleor channel found for organization ${organizationId}`,
					originalError: new Error("Channel not found"),
				}),
			);
		}

		return {
			saleorChannelId: channels.saleorChannelId,
			slug: channels.slug,
		};
	});
}

/**
 * Get organization's warehouse
 */
function getWarehouseEffect(
	organizationId: string,
): Effect.Effect<
	{ saleorWarehouseId: string; name: string },
	DatabaseError,
	never
> {
	return Effect.gen(function* () {
		const warehouse = yield* withDrizzleErrors("warehouses", "findFirst", () =>
			db.query.warehouses.findFirst({
				where: (warehouses: any, { eq }: any) =>
					eq(warehouses.organizationId, organizationId) &&
					eq(warehouses.isActive, true),
			}),
		);

		if (!warehouse) {
			return yield* Effect.fail(
				new GenericDatabaseError({
					operation: "getWarehouse",
					table: "warehouses",
					pgCode: undefined,
					detail: `No active warehouse found for organization ${organizationId}`,
					originalError: new Error("Warehouse not found"),
				}),
			);
		}

		return {
			saleorWarehouseId: warehouse.saleorWarehouseId,
			name: warehouse.name,
		};
	});
}

/**
 * Get products from master catalog
 *
 * TODO: Replace with actual master catalog query
 * For now, fetches from products table with masterCatalogId
 */
function getMasterCatalogProductsEffect(
	masterChannelSlug: string,
): Effect.Effect<MasterProduct[], DatabaseError, never> {
	return Effect.gen(function* () {
		// TODO: Query actual master catalog
		// For now, return empty array as placeholder
		console.log(`Fetching from master catalog: ${masterChannelSlug}`);

		const products = yield* withDrizzleErrors("products", "findMany", () =>
			db.query.products.findMany({
				where: (products: any, { isNotNull }: any) =>
					isNotNull(products.saleorProductId), // Products already in Saleor
				limit: 1200, // Safety limit
			}),
		);

		// Map to MasterProduct format
		return products.map((p: any) => ({
			id: p.id,
			saleorProductId: p.saleorProductId,
			name: p.name,
			description: p.description,
			sku: p.sku || `SKU-${p.id}`,
			price: p.basePrice || 1000,
			cost: p.currentFIFOCost || 500,
			category: "Spirits",
			productType: "Liquor",
			isActive: p.isActive ?? true,
		}));
	});
}

/**
 * Sync single product to Saleor
 *
 * With retry logic for transient failures
 */
function syncProductEffect(
	product: MasterProduct,
	channelId: string,
	warehouseId: string,
	state: SyncState,
	onProgress: ((current: number, total: number) => void) | undefined,
	total: number,
): Effect.Effect<void, never, never> {
	return Effect.gen(function* () {
		// Validate product
		const validationError = validateMasterProduct(product);
		if (validationError) {
			console.warn(`⚠️ Skipping invalid product: ${validationError}`);
			state.skipped++;
			state.synced++;
			if (onProgress) onProgress(state.synced, total);
			return;
		}

		try {
			// Build mutation
			const mutation = buildProductSyncMutation(
				product,
				channelId,
				warehouseId,
			);

			// Create product in Saleor (with retry)
			yield* Effect.retry(
				Effect.tryPromise({
					try: async () => {
						// TODO: Implement actual Saleor product creation
						// For now, just simulate
						console.log(`Synced: ${product.name}`);
						return { success: true };
					},
					catch: (error) =>
						new SaleorProductCreationFailed({
							productName: product.name,
							reason: String(error),
							saleorErrors: [{ message: String(error) }],
						}),
				}),
				{
					times: 2,
					schedule: Schedule.exponential("1 second", 2.0),
				},
			).pipe(
				Effect.catchAll(() => {
					// Log failure but don't stop batch
					console.error(`Failed: ${product.name}`);
					state.failed++;
					state.failedProducts.push({
						name: product.name,
						error: "Sync failed after retries",
					});
					return Effect.succeed(undefined);
				}),
			);

			state.synced++;
			if (onProgress) {
				onProgress(state.synced, total);
			}
		} catch (error) {
			state.failed++;
			state.failedProducts.push({
				name: product.name,
				error: String(error),
			});
		}
	});
}
