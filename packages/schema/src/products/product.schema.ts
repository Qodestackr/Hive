import { z } from "zod";
import { ID, Timestamps } from "../shared/base.schema.js";

// ============================================================================
// PRODUCT SCHEMAS
// ============================================================================

/**
 * Base product schema (matches DB product table)
 */
export const ProductSchema = z
    .object({
        id: z.string(),
        organizationId: z.string(),

        // Product details
        name: z.string(),
        sku: z.string(),
        category: z.string().nullable(),
        description: z.string().nullable(),

        // Saleor integration (source of truth)
        saleorProductId: z.string().nullable(),
        saleorVariantId: z.string().nullable(),
        saleorChannelId: z.string().nullable(),

        // Pricing
        basePrice: z.number().nonnegative(),

        // Current inventory intelligence (calculated fields)
        currentFIFOCost: z.number().nonnegative().nullable(),
        currentStockQuantity: z.number().int().nonnegative().default(0),
        reorderPoint: z.number().int().nonnegative().default(0),
        leadTimeDays: z.number().int().nonnegative().default(7),

        // Compliance (for alcohol)
        alcoholContent: z.number().nonnegative().nullable(),
        requiresAgeVerification: z.boolean().default(true),

        // AI intelligence
        isSlowMover: z.boolean().default(false),
        avgMarginPercent: z.number().nullable(),

        // Metadata
        images: z.array(z.string().url()).nullable(),
        tags: z.array(z.string()).default([]),

        isActive: z.boolean().default(true),
    })
    .merge(Timestamps)
    .openapi('Product');

/**
 * Product create input (what API accepts)
 */
export const ProductCreateSchema = z.object({
    name: z.string().min(1, "Product name is required").openapi({ example: 'Hennessy XO' }),
    sku: z.string().min(1, "SKU is required").openapi({ example: 'HENN-XO-750' }),
    category: z.string().optional().openapi({ example: 'Cognac' }),
    description: z.string().optional().openapi({ example: 'Premium cognac aged 10+ years' }),

    basePrice: z.number().nonnegative("Price must be non-negative").openapi({ example: 11000 }),

    // Optional fields
    saleorProductId: z.string().optional(),
    saleorVariantId: z.string().optional(),
    alcoholContent: z.number().nonnegative().optional().openapi({ example: 40 }),
    requiresAgeVerification: z.boolean().default(true),

    images: z.array(z.string().url()).optional(),
    tags: z.array(z.string()).default([]),
}).openapi('ProductCreate');

/**
 * Product update input (partial)
 */
export const ProductUpdateSchema = ProductCreateSchema.partial().openapi('ProductUpdate');

/**
 * Product list query params
 */
export const ProductListQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1).openapi({ example: 1 }),
    limit: z.coerce.number().int().positive().max(100).default(20).openapi({ example: 20 }),
    search: z.string().optional().openapi({ example: 'Hennessy' }),
    category: z.string().optional().openapi({ example: 'Cognac' }),
    isActive: z.coerce.boolean().optional(),
    isSlowMover: z.coerce.boolean().optional(),
    sortBy: z.enum(["name", "sku", "basePrice", "currentStockQuantity", "createdAt"]).default("name"),
    sortOrder: z.enum(["asc", "desc"]).default("asc"),
}).openapi('ProductListQuery');

/**
 * Product response (what API returns)
 */
export const ProductResponseSchema = ProductSchema.openapi('ProductResponse');

/**
 * Product list response
 */
export const ProductListResponseSchema = z.object({
    data: z.array(ProductResponseSchema),
    pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
    }),
}).openapi('ProductListResponse');

/**
 * Product price update (quick update for onboarding)
 */
export const ProductPriceUpdateSchema = z.object({
    basePrice: z.number().nonnegative("Price must be non-negative").openapi({ example: 11500 }),
    currentStockQuantity: z.number().int().nonnegative().optional().openapi({ example: 50 }),
}).openapi('ProductPriceUpdate');

/**
 * Bulk product price update
 */
export const BulkProductPriceUpdateSchema = z.object({
    updates: z.array(
        z.object({
            productId: z.string().openapi({ example: 'prod_123' }),
            basePrice: z.number().nonnegative().openapi({ example: 11500 }),
            currentStockQuantity: z.number().int().nonnegative().optional().openapi({ example: 50 }),
        })
    ).min(1, "At least one product update required"),
}).openapi('BulkProductPriceUpdate');

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Product = z.infer<typeof ProductSchema>;
export type ProductCreate = z.infer<typeof ProductCreateSchema>;
export type ProductUpdate = z.infer<typeof ProductUpdateSchema>;
export type ProductListQuery = z.infer<typeof ProductListQuerySchema>;
export type ProductResponse = z.infer<typeof ProductResponseSchema>;
export type ProductListResponse = z.infer<typeof ProductListResponseSchema>;
export type ProductPriceUpdate = z.infer<typeof ProductPriceUpdateSchema>;
export type BulkProductPriceUpdate = z.infer<typeof BulkProductPriceUpdateSchema>;
