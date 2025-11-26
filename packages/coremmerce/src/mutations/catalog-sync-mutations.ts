import { slugify } from "@repo/utils"
import type { CountryCode } from "../gql/graphql"

export interface MasterProduct {
    id: string
    saleorProductId?: string
    name: string
    description?: string
    sku: string
    price: number  // Selling price
    cost: number   // Cost price (FIFO initial)
    category?: string
    productType?: string
    weight?: number
    isActive?: boolean
}

export interface ProductSyncMutation {
    product: {
        name: string
        description: string
        productType: string
        category: string
        slug: string
    }
    variant: {
        sku: string
        name: string
        weight?: number
        trackInventory: boolean
    }
    pricing: {
        channelId: string
        price: number
        costPrice: number
    }
    stock: {
        warehouseId: string
        quantity: number
    }
}

/**
 * Build product sync mutation from master product
 * 
 * @param masterProduct - Source product from master catalog
 * @param targetChannelId - Destination Saleor channel ID
 * @param targetWarehouseId - Destination warehouse ID
 * @returns Complete mutation data for creating product
 */
export function buildProductSyncMutation(
    masterProduct: MasterProduct,
    targetChannelId: string,
    targetWarehouseId: string
): ProductSyncMutation {    
    const slug = slugify(masterProduct.name)
    return {
        product: {
            name: masterProduct.name,
            description: masterProduct.description || `${masterProduct.name} - Premium liquor product`,
            productType: masterProduct.productType || "Liquor",
            category: masterProduct.category || "Spirits",
            slug: `${slug}-${masterProduct.sku.toLowerCase()}`,
        },
        variant: {
            sku: masterProduct.sku,
            name: masterProduct.name,
            weight: masterProduct.weight,
            trackInventory: true,
        },
        pricing: {
            channelId: targetChannelId,
            price: masterProduct.price,
            costPrice: masterProduct.cost,
        },
        stock: {
            warehouseId: targetWarehouseId,
            quantity: 0, // Bootstrap with 0 quantity
        },
    }
}

/**
 * Batch products into chunks for processing
 * 
 * @param products - Array of products to batch
 * @param batchSize - Size of each batch (default 50)
 * @returns Array of batches
 */
export function batchProducts<T>(products: T[], batchSize: number = 50): T[][] {
    const batches: T[][] = []
    for (let i = 0; i < products.length; i += batchSize) {
        batches.push(products.slice(i, i + batchSize))
    }
    return batches
}

/**
 * Calculate sync progress percentage
 * 
 * @param current - Current count
 * @param total - Total count
 * @returns Progress percentage (0-100)
 */
export function calculateProgress(current: number, total: number): number {
    if (total === 0) return 100
    return Math.min(100, Math.round((current / total) * 100))
}

/**
 * Validate master product data
 * 
 * @param product - Product to validate
 * @returns Error message if invalid, undefined if valid
 */
export function validateMasterProduct(product: MasterProduct): string | undefined {
    if (!product.name || product.name.trim() === '') {
        return `Product ${product.id}: name is required`
    }

    if (!product.sku || product.sku.trim() === '') {
        return `Product ${product.id}: SKU is required`
    }

    if (product.price <= 0) {
        return `Product ${product.sku}: price must be greater than 0`
    }

    if (product.cost < 0) {
        return `Product ${product.sku}: cost cannot be negative`
    }

    return undefined
}
