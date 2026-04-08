import { createError } from "@repo/utils";
import {
	executeMutation,
	executeQuery,
	executeSaleorRequest,
} from "../client/saleor-client";
import {
	SaleorProductCreationFailed,
	SaleorProductNotFound,
	SaleorStockUpdateFailed,
	SaleorVariantNotFound,
} from "../errors/saleor-errors";
import {
	CreateProductDocument,
	type CreateProductMutation,
	CreateProductVariantDocument,
	type CreateProductVariantMutation,
	GetProductDetailsDocument,
	type GetProductDetailsQuery,
	GetProductsDocument,
	type GetProductsQuery,
	ProductInventoryDocument,
	type ProductInventoryQuery,
	PublishProductToChannelDocument,
	SearchProductsBasicDocument,
	SetProductVariantPriceDocument,
	UpdateStockDocument,
	UpdateVariantCostPriceDocument,
} from "../gql/graphql";
import type { SaleorContext } from "../types";

/**
 * Get product details from Saleor by ID
 *
 * @throws {SaleorProductNotFound} If product doesn't exist
 * @throws {PromcoError} For other Saleor failures
 */
export async function getProductById(
	productId: string,
	context: SaleorContext,
): Promise<any> {
	// TODO: Replace 'any' with ProductDetailsQuery['product'] after codegen

	const data = await executeSaleorRequest(
		GetProductDetailsDocument,
		{ id: productId, channel: context.channelSlug },
		context,
	);

	if (!data.product) {
		throw new SaleorProductNotFound({
			saleorProductId: productId,
			channelSlug: context.channelSlug,
		});
	}

	return data.product;
}

/**
 * Get product details from Saleor by slug
 *
 * @throws {SaleorProductNotFound} If product doesn't exist
 * @throws {PromcoError} For other Saleor failures
 */
export async function getProductBySlug(
	slug: string,
	context: SaleorContext,
): Promise<any> {
	const data = await executeSaleorRequest(
		GetProductDetailsDocument,
		{ slug, channel: context.channelSlug },
		context,
	);

	if (!data.product) {
		throw new SaleorProductNotFound({
			slug,
			channelSlug: context.channelSlug,
		});
	}

	return data.product;
}

/**
 * Get product inventory across all warehouses
 * Returns variant-level stock information
 */
export async function getProductInventory(
	productId: string,
	context: SaleorContext,
): Promise<any[]> {
	const data = await executeSaleorRequest(
		ProductInventoryDocument,
		{ id: productId },
		context,
	);

	if (!data.product) {
		throw new SaleorProductNotFound({
			saleorProductId: productId,
			channelSlug: context.channelSlug,
		});
	}

	return data.product.variants || [];
}

/**
 * List products with optional filtering
 * Supports pagination
 */
export async function listProducts(
	params: {
		first?: number;
		after?: string;
		search?: string;
		filter?: any;
	},
	context: SaleorContext,
): Promise<any> {
	const { first = 50, after, search, filter } = params;

	const data = await executeSaleorRequest(
		GetProductDetailsDocument, // TODO: Use GetProductsDocument
		{
			first,
			after,
			channel: context.channelSlug,
			filter: {
				...filter,
				...(search && { search }),
			},
		},
		context,
	);

	return data.products;
}

/**
 * Create a new product in Saleor
 *
 * NOTE: Does NOT create variants automatically
 * Use createProductVariant() separately
 *
 * @throws {SaleorProductCreationFailed} If creation fails
 */
export async function createProduct(
	input: {
		name: string;
		slug: string;
		productTypeId: string;
		categoryId?: string;
		description?: string;
		attributes?: Array<{ id: string; values: string[] }>;
	},
	context: SaleorContext,
): Promise<any> {
	const data = await executeSaleorRequest(
		CreateProductDocument,
		{
			input: {
				name: input.name,
				slug: input.slug,
				productType: input.productTypeId,
				category: input.categoryId,
				description: input.description,
				attributes: input.attributes || [],
			},
		},
		context,
	);

	// Check for Saleor-level errors
	if (data.productCreate?.errors && data.productCreate.errors.length > 0) {
		throw new SaleorProductCreationFailed({
			productName: input.name,
			reason: "Saleor returned validation errors",
			saleorErrors: data.productCreate.errors,
		});
	}

	if (!data.productCreate?.product) {
		throw new SaleorProductCreationFailed({
			productName: input.name,
			reason: "No product returned from Saleor",
		});
	}

	return data.productCreate.product;
}

/**
 * Create a product variant with optional initial stock
 *
 * @throws {SaleorProductCreationFailed} If variant creation fails
 */
export async function createProductVariant(
	input: {
		productId: string;
		name: string;
		sku: string;
		attributeId?: string;
		attributeValue?: string;
		initialQuantity?: number;
		trackInventory?: boolean;
	},
	context: SaleorContext,
): Promise<any> {
	// Build stocks array if initial quantity provided
	const stocks =
		input.initialQuantity !== undefined
			? [
					{
						warehouse: context.warehouseId,
						quantity: input.initialQuantity,
					},
				]
			: [];

	// Build attributes array
	const attributes =
		input.attributeId && input.attributeValue
			? [
					{
						id: input.attributeId,
						values: [input.attributeValue],
					},
				]
			: [];

	const data = await executeSaleorRequest(
		CreateProductVariantDocument,
		{
			input: {
				product: input.productId,
				sku: input.sku,
				name: input.name,
				trackInventory: input.trackInventory ?? true,
				attributes,
				stocks,
			},
		},
		context,
	);

	if (
		data.productVariantCreate?.errors &&
		data.productVariantCreate.errors.length > 0
	) {
		throw new SaleorProductCreationFailed({
			productName: input.name,
			reason: "Variant creation failed",
			saleorErrors: data.productVariantCreate.errors,
		});
	}

	if (!data.productVariantCreate?.productVariant) {
		throw new SaleorProductCreationFailed({
			productName: input.name,
			reason: "No variant returned from Saleor",
		});
	}

	return data.productVariantCreate.productVariant;
}

/**
 * Set variant price in a specific channel
 *
 * @throws {PromcoError} If price update fails
 */
export async function setVariantPrice(
	variantId: string,
	price: number,
	context: SaleorContext,
): Promise<any> {
	const data = await executeSaleorRequest(
		SetProductVariantPriceDocument,
		{
			id: variantId,
			input: [
				{
					channelId: context.channelId,
					price: price.toString(),
				},
			],
		},
		context,
	);

	if (data.productVariantChannelListingUpdate?.errors?.length) {
		const error = data.productVariantChannelListingUpdate.errors[0];
		throw createError.external(
			"Saleor",
			new Error(error.message || "Price update failed"),
			{
				variantId,
				channelId: context.channelId,
				saleorErrors: data.productVariantChannelListingUpdate.errors,
			},
		);
	}

	return data.productVariantChannelListingUpdate?.variant;
}

/**
 * Update variant cost price (for FIFO sync)
 *
 * This is OPTIONAL - only use if syncing Promco FIFO average to Saleor
 *
 * @throws {PromcoError} If cost price update fails
 */
export async function updateVariantCostPrice(
	variantId: string,
	costPrice: number,
	context: SaleorContext,
): Promise<any> {
	const data = await executeSaleorRequest(
		UpdateVariantCostPriceDocument,
		{
			id: variantId,
			input: [
				{
					channelId: context.channelId,
					costPrice: costPrice.toString(),
				},
			],
		},
		context,
	);

	if (data.productVariantChannelListingUpdate?.errors?.length) {
		const error = data.productVariantChannelListingUpdate.errors[0];
		throw createError.external(
			"Saleor",
			new Error(error.message || "Cost price update failed"),
			{
				variantId,
				channelId: context.channelId,
				operation: "updateCostPrice",
				saleorErrors: data.productVariantChannelListingUpdate.errors,
			},
		);
	}

	return data.productVariantChannelListingUpdate?.variant;
}

/**
 * Update stock quantity for a variant in the organization's warehouse
 *
 * @throws {SaleorStockUpdateFailed} If stock update fails
 */
export async function updateStock(
	variantId: string,
	quantity: number,
	context: SaleorContext,
): Promise<any> {
	// Validate quantity
	if (quantity < 0) {
		throw createError.validation(
			"Stock quantity cannot be negative",
			"quantity",
			{
				variantId,
				requestedQuantity: quantity,
			},
		);
	}

	const data = await executeSaleorRequest(
		UpdateStockDocument,
		{
			variantId,
			stocks: [
				{
					warehouse: context.warehouseId,
					quantity,
				},
			],
		},
		context,
	);

	if (data.productVariantStocksUpdate?.errors?.length) {
		const error = data.productVariantStocksUpdate.errors[0];
		throw new SaleorStockUpdateFailed({
			variantId,
			warehouseId: context.warehouseId,
			requestedQuantity: quantity,
			reason: error.message || "Unknown error",
		});
	}

	if (!data.productVariantStocksUpdate?.productVariant) {
		throw new SaleorStockUpdateFailed({
			variantId,
			warehouseId: context.warehouseId,
			requestedQuantity: quantity,
			reason: "No variant returned after stock update",
		});
	}

	return data.productVariantStocksUpdate.productVariant;
}

/**
 * Publish product to channel (make it visible/available)
 *
 * @throws {PromcoError} If publish fails
 */
export async function publishProductToChannel(
	productId: string,
	context: SaleorContext,
): Promise<any> {
	const data = await executeSaleorRequest(
		PublishProductToChannelDocument,
		{
			productId,
			channelId: context.channelId,
		},
		context,
	);

	if (data.productChannelListingUpdate?.errors?.length) {
		const error = data.productChannelListingUpdate.errors[0];
		throw createError.external(
			"Saleor",
			new Error(error.message || "Publish failed"),
			{
				productId,
				channelId: context.channelId,
				operation: "publish",
				saleorErrors: data.productChannelListingUpdate.errors,
			},
		);
	}

	return data.productChannelListingUpdate?.product;
}

/**
 * Get variant by SKU
 * Useful for matching Promco products to Saleor variants
 *
 * @throws {SaleorVariantNotFound} If variant doesn't exist
 */
export async function getVariantBySKU(
	sku: string,
	context: SaleorContext,
): Promise<any> {
	// Search for products with this SKU
	const data = await executeSaleorRequest(
		GetProductDetailsDocument, // TODO: Use SearchProductsDocument
		{
			first: 1,
			channel: context.channelSlug,
			filter: { search: sku },
		},
		context,
	);

	// Find variant with exact SKU match
	const product = data.products?.edges?.[0]?.node;
	if (!product) {
		throw new SaleorVariantNotFound({
			sku,
			channelSlug: context.channelSlug,
		});
	}

	const variant = product.variants?.find((v: any) => v.sku === sku);
	if (!variant) {
		throw new SaleorVariantNotFound({
			sku,
			channelSlug: context.channelSlug,
		});
	}

	return variant;
}
