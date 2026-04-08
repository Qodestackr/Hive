import type { paths } from "@repo/schema/generated/openapi";
import { api } from "../client";

type CustomerCreate = NonNullable<
    paths["/api/v1/customers"]["post"]["requestBody"]
>["content"]["application/json"];

type CustomerUpdate = NonNullable<
    paths["/api/v1/customers/{id}"]["put"]["requestBody"]
>["content"]["application/json"];

type CustomerListQuery =
    paths["/api/v1/customers"]["get"]["parameters"]["query"];

type BulkImport = NonNullable<
    paths["/api/v1/customers/bulk-import"]["post"]["requestBody"]
>["content"]["application/json"];

type VerifyAge = NonNullable<
    paths["/api/v1/customers/{id}/verify-age"]["post"]["requestBody"]
>["content"]["application/json"];

export const customers = {
    list: (query?: CustomerListQuery) =>
        api.GET("/api/v1/customers", { params: { query } }),

    get: (id: string) =>
        api.GET("/api/v1/customers/{id}", {
            params: { path: { id } },
        }),

    create: (data: CustomerCreate) =>
        api.POST("/api/v1/customers", { body: data }),

    update: (id: string, data: CustomerUpdate) =>
        api.PUT("/api/v1/customers/{id}", {
            params: { path: { id } },
            body: data,
        }),

    delete: (id: string) =>
        api.DELETE("/api/v1/customers/{id}", {
            params: { path: { id } },
        }),

    verifyAge: (id: string, data: VerifyAge) =>
        api.POST("/api/v1/customers/{id}/verify-age", {
            params: { path: { id } },
            body: data,
        }),

    optIn: (id: string) =>
        api.POST("/api/v1/customers/{id}/opt-in", {
            params: { path: { id } },
        }),

    optOut: (id: string) =>
        api.POST("/api/v1/customers/{id}/opt-out", {
            params: { path: { id } },
        }),

    bulkImport: (data: BulkImport) =>
        api.POST("/api/v1/customers/bulk-import", { body: data }),

    stats: () => api.GET("/api/v1/customers/stats"),
};
