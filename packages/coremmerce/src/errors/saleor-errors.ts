/**
 * Saleor-Specific Domain Errors
 * 
 * Follows the same pattern as packages/utils/src/errors/domain/*
 * Uses Effect's Data.TaggedError for type-safe error handling
 */

import { Data } from "effect";
import { ErrorCode } from "@repo/utils";

/**
 * Product not found in Saleor
 * Use when fetching by ID/slug and nothing is returned
 */
export class SaleorProductNotFound extends Data.TaggedError("SaleorProductNotFound")<{
    readonly saleorProductId?: string;
    readonly slug?: string;
    readonly channelSlug: string;
}> {
    readonly errorCode = ErrorCode.RECORD_NOT_FOUND;
    readonly statusCode = 404;

    get message() {
        const identifier = this.saleorProductId || this.slug || "unknown";
        return `Product '${identifier}' not found in Saleor channel '${this.channelSlug}'`;
    }
}

/**
 * Variant not found in Saleor
 */
export class SaleorVariantNotFound extends Data.TaggedError("SaleorVariantNotFound")<{
    readonly variantId?: string;
    readonly sku?: string;
    readonly channelSlug: string;
}> {
    readonly errorCode = ErrorCode.RECORD_NOT_FOUND;
    readonly statusCode = 404;

    get message() {
        const identifier = this.variantId || this.sku || "unknown";
        return `Variant '${identifier}' not found in Saleor channel '${this.channelSlug}'`;
    }
}

/**
 * Stock update operation failed in Saleor
 */
export class SaleorStockUpdateFailed extends Data.TaggedError("SaleorStockUpdateFailed")<{
    readonly variantId: string;
    readonly warehouseId: string;
    readonly requestedQuantity: number;
    readonly reason: string;
}> {
    readonly errorCode = ErrorCode.EXTERNAL_SERVICE_ERROR;
    readonly statusCode = 502;

    get message() {
        return `Failed to update stock for variant '${this.variantId}' in warehouse '${this.warehouseId}': ${this.reason}`;
    }
}

/**
 * Product creation failed in Saleor
 */
export class SaleorProductCreationFailed extends Data.TaggedError("SaleorProductCreationFailed")<{
    readonly productName: string;
    readonly reason: string;
    readonly saleorErrors?: Array<{ field?: string; message: string; code?: string }>;
}> {
    readonly errorCode = ErrorCode.EXTERNAL_SERVICE_ERROR;
    readonly statusCode = 502;

    get message() {
        const errorDetails = this.saleorErrors
            ? `\nSaleor errors: ${JSON.stringify(this.saleorErrors)}`
            : "";
        return `Failed to create product '${this.productName}' in Saleor: ${this.reason}${errorDetails}`;
    }
}

/**
 * Promotion operation failed in Saleor
 */
export class SaleorPromotionError extends Data.TaggedError("SaleorPromotionError")<{
    readonly promotionId?: string;
    readonly promotionName?: string;
    readonly operation: "create" | "update" | "delete" | "get" | "createRule" | "updateRule";
    readonly reason: string;
    readonly saleorErrors?: Array<{ field?: string; message: string; code?: string }>;
}> {
    readonly errorCode = ErrorCode.EXTERNAL_SERVICE_ERROR;
    readonly statusCode = 502;

    get message() {
        const identifier = this.promotionId || this.promotionName || "unknown";
        const errorDetails = this.saleorErrors
            ? `\nSaleor errors: ${JSON.stringify(this.saleorErrors)}`
            : "";
        return `Promotion ${this.operation} failed for '${identifier}': ${this.reason}${errorDetails}`;
    }
}

/**
 * Invalid Saleor channel configuration
 */
export class SaleorInvalidChannelConfig extends Data.TaggedError("SaleorInvalidChannelConfig")<{
    readonly organizationId: string;
    readonly missingFields: string[];
}> {
    readonly errorCode = ErrorCode.CONFIGURATION_ERROR;
    readonly statusCode = 500;

    get message() {
        return `Invalid Saleor channel configuration for organization '${this.organizationId}'. Missing: ${this.missingFields.join(", ")}`;
    }
}

/**
 * Saleor API rate limit exceeded
 */
export class SaleorRateLimitExceeded extends Data.TaggedError("SaleorRateLimitExceeded")<{
    readonly retryAfter?: number; // seconds
}> {
    readonly errorCode = ErrorCode.RATE_LIMIT_EXCEEDED;
    readonly statusCode = 429;

    get message() {
        return this.retryAfter
            ? `Saleor API rate limit exceeded. Retry after ${this.retryAfter} seconds`
            : "Saleor API rate limit exceeded";
    }
}

/**
 * Channel creation failed in Saleor
 */
export class SaleorChannelCreationFailed extends Data.TaggedError("SaleorChannelCreationFailed")<{
    readonly channelName: string;
    readonly reason: string;
    readonly saleorErrors?: Array<{ field?: string; message: string; code?: string }>;
}> {
    readonly errorCode = ErrorCode.EXTERNAL_SERVICE_ERROR;
    readonly statusCode = 502;

    get message() {
        const errorDetails = this.saleorErrors
            ? `\nSaleor errors: ${JSON.stringify(this.saleorErrors)}`
            : "";
        return `Failed to create channel '${this.channelName}' in Saleor: ${this.reason}${errorDetails}`;
    }
}

/**
 * Warehouse creation failed in Saleor
 */
export class SaleorWarehouseCreationFailed extends Data.TaggedError("SaleorWarehouseCreationFailed")<{
    readonly warehouseName: string;
    readonly reason: string;
    readonly saleorErrors?: Array<{ field?: string; message: string; code?: string }>;
}> {
    readonly errorCode = ErrorCode.EXTERNAL_SERVICE_ERROR;
    readonly statusCode = 502;

    get message() {
        const errorDetails = this.saleorErrors
            ? `\nSaleor errors: ${JSON.stringify(this.saleorErrors)}`
            : "";
        return `Failed to create warehouse '${this.warehouseName}' in Saleor: ${this.reason}${errorDetails}`;
    }
}

/**
 * Shipping zone creation failed in Saleor
 */
export class SaleorShippingZoneCreationFailed extends Data.TaggedError("SaleorShippingZoneCreationFailed")<{
    readonly zoneName: string;
    readonly reason: string;
    readonly saleorErrors?: Array<{ field?: string; message: string; code?: string }>;
}> {
    readonly errorCode = ErrorCode.EXTERNAL_SERVICE_ERROR;
    readonly statusCode = 502;

    get message() {
        const errorDetails = this.saleorErrors
            ? `\nSaleor errors: ${JSON.stringify(this.saleorErrors)}`
            : "";
        return `Failed to create shipping zone '${this.zoneName}' in Saleor: ${this.reason}${errorDetails}`;
    }
}

/**
 * Channel activation failed in Saleor
 */
export class SaleorChannelActivationFailed extends Data.TaggedError("SaleorChannelActivationFailed")<{
    readonly channelId: string;
    readonly reason: string;
    readonly saleorErrors?: Array<{ field?: string; message: string; code?: string }>;
}> {
    readonly errorCode = ErrorCode.EXTERNAL_SERVICE_ERROR;
    readonly statusCode = 502;

    get message() {
        const errorDetails = this.saleorErrors
            ? `\nSaleor errors: ${JSON.stringify(this.saleorErrors)}`
            : "";
        return `Failed to activate channel '${this.channelId}' in Saleor: ${this.reason}${errorDetails}`;
    }
}

/**
 * Resource already exists (idempotency check)
 */
export class SaleorResourceAlreadyExists extends Data.TaggedError("SaleorResourceAlreadyExists")<{
    readonly resourceType: "channel" | "warehouse";
    readonly organizationId: string;
    readonly existingResourceId: string;
}> {
    readonly errorCode = ErrorCode.DUPLICATE_RECORD;
    readonly statusCode = 409;

    get message() {
        return `Saleor ${this.resourceType} already exists for organization '${this.organizationId}' (ID: ${this.existingResourceId})`;
    }
}

/**
 * Union of all Saleor domain errors
 */
export type SaleorDomainError =
    | SaleorProductNotFound
    | SaleorVariantNotFound
    | SaleorStockUpdateFailed
    | SaleorProductCreationFailed
    | SaleorPromotionError
    | SaleorInvalidChannelConfig
    | SaleorRateLimitExceeded
    | SaleorChannelCreationFailed
    | SaleorWarehouseCreationFailed
    | SaleorShippingZoneCreationFailed
    | SaleorChannelActivationFailed
    | SaleorResourceAlreadyExists;
