import type { paths } from "@repo/schema/generated/openapi";
import { api } from "../client";

type ResolveAlert = NonNullable<
    paths["/api/v1/campaigns/{id}/alerts/{alertId}"]["put"]["requestBody"]
>["content"]["application/json"];

type UpdateAlertSettings = NonNullable<
    paths["/api/v1/campaigns/{id}/settings/alerts"]["put"]["requestBody"]
>["content"]["application/json"];

type BulkCheck = NonNullable<
    paths["/api/v1/campaigns/bulk-check"]["post"]["requestBody"]
>["content"]["application/json"];

export const alerts = {
    summary: () => api.GET("/api/v1/alerts/summary"),

    campaignAlerts: (campaignId: string) =>
        api.GET("/api/v1/campaigns/{id}/alerts", {
            params: { path: { id: campaignId } },
        }),

    resolve: (campaignId: string, alertId: string, data: ResolveAlert) =>
        api.PUT("/api/v1/campaigns/{id}/alerts/{alertId}", {
            params: { path: { id: campaignId, alertId } },
            body: data,
        }),

    getSettings: (campaignId: string) =>
        api.GET("/api/v1/campaigns/{id}/settings/alerts", {
            params: { path: { id: campaignId } },
        }),

    updateSettings: (campaignId: string, data: UpdateAlertSettings) =>
        api.PUT("/api/v1/campaigns/{id}/settings/alerts", {
            params: { path: { id: campaignId } },
            body: data,
        }),

    bulkCheck: (data: BulkCheck) =>
        api.POST("/api/v1/campaigns/bulk-check", { body: data }),
};
