/**
 * Core Types for Saleor Integration
 * 
 * These types define the contract between services and the coremmerce layer.
 * SaleorContext is injected via DI, never prop-drilled.
 */

/**
 * Saleor Context - Encapsulates all org-specific Saleor configuration
 * 
 * Injected by services layer via getSaleorContext(organizationId)
 * Hot cached to avoid repeated DB lookups
 */
export interface SaleorContext {
    /** Saleor organization channel ID (base64, e.g., "Q2hhbm5lbDoz") */
    channelId: string;

    /** Human-readable channel slug (e.g., "chann-tnlljubkqz") */
    channelSlug: string;

    /** Saleor warehouse ID (base64) */
    warehouseId: string;

    /** Promco organization ID (for correlation/logging) */
    organizationId: string;

    /** Business type (for context-specific logic if needed) */
    businessType?: string;
}

/**
 * Result pattern for Saleor operations
 * NOT USED DIRECTLY - we throw PromcoError instead
 * Kept for reference in case you want Result pattern later
 */
export type SaleorResult<T> =
    | { success: true; data: T }
    | { success: false; error: SaleorError };

/**
 * Saleor-specific error details
 * Used in PromcoError context field
 */
export interface SaleorError {
    code: string;
    message: string;
    field?: string;
    details?: Record<string, any>;
}

/**
 * Saleor GraphQL error response shape
 */
export interface SaleorGraphQLError {
    message: string;
    code?: string;
    field?: string;
    extensions?: Record<string, any>;
}
