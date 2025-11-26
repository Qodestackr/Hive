// Saleor integration core types
// Defines contract btween services and coremmerce layer.
// SaleorContext is injected via DI

export interface SaleorContext {
    channelId: string;
    channelSlug: string;
    warehouseId: string;
    organizationId: string;
    businessType?: string;
}

// TODO: Result pattern.
export type SaleorResult<T> =
    | { success: true; data: T }
    | { success: false; error: SaleorError };

export interface SaleorError {
    code: string;
    message: string;
    field?: string;
    details?: Record<string, any>;
}

export interface SaleorGraphQLError {
    message: string;
    code?: string;
    field?: string;
    extensions?: Record<string, any>;
}
