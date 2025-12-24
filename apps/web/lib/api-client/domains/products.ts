import type { paths } from "@repo/schema/generated/openapi";
import { api } from "../client";

type ProductCreate = NonNullable<
    paths["/api/v1/products"]["post"]["requestBody"]
>["content"]["application/json"];

type ProductUpdate = NonNullable<
    paths["/api/v1/products/{id}"]["put"]["requestBody"]
>["content"]["application/json"];

type ProductListQuery =
    paths["/api/v1/products"]["get"]["parameters"]["query"];

type ProductPriceUpdate = NonNullable<
    paths["/api/v1/products/{id}/price"]["put"]["requestBody"]
>["content"]["application/json"];

type BulkPriceUpdate = NonNullable<
    paths["/api/v1/products/bulk-price-update"]["post"]["requestBody"]
>["content"]["application/json"];

export const products = {
    list: (query?: ProductListQuery) =>
        api.GET("/api/v1/products", { params: { query } }),

    get: (id: string) =>
        api.GET("/api/v1/products/{id}", {
            params: { path: { id } },
        }),

    create: (data: ProductCreate) =>
        api.POST("/api/v1/products", { body: data }),

    update: (id: string, data: ProductUpdate) =>
        api.PUT("/api/v1/products/{id}", {
            params: { path: { id } },
            body: data,
        }),

    delete: (id: string) =>
        api.DELETE("/api/v1/products/{id}", {
            params: { path: { id } },
        }),

    updatePrice: (id: string, data: ProductPriceUpdate) =>
        api.PUT("/api/v1/products/{id}/price", {
            params: { path: { id } },
            body: data,
        }),

    bulkUpdatePrice: (data: BulkPriceUpdate) =>
        api.POST("/api/v1/products/bulk-price-update", { body: data }),

    getFIFOBatches: (id: string) =>
        api.GET("/api/v1/products/{id}/fifo-batches", {
            params: { path: { id } },
        }),
};
