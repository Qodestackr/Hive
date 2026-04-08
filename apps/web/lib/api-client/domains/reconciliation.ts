import type { paths } from "@repo/schema/generated/openapi";
import { api } from "../client";

type ReconcileProduct = NonNullable<
    paths["/api/v1/reconciliation/product"]["post"]["requestBody"]
>["content"]["application/json"];

type CorrectDiscrepancy = NonNullable<
    paths["/api/v1/reconciliation/correct"]["post"]["requestBody"]
>["content"]["application/json"];

export const reconciliation = {
    product: (data: ReconcileProduct) =>
        api.POST("/api/v1/reconciliation/product", { body: data }),

    organization: () =>
        api.POST("/api/v1/reconciliation/organization"),

    correct: (data: CorrectDiscrepancy) =>
        api.POST("/api/v1/reconciliation/correct", { body: data }),
};
