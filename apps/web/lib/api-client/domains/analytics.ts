import type { paths } from "@repo/schema/generated/openapi";
import { api } from "../client";

export const analytics = {
    campaignHealth: () => api.GET("/api/v1/analytics/campaign-health"),
    slowMovers: () => api.GET("/api/v1/analytics/slow-movers"),
    captureROI: () => api.GET("/api/v1/analytics/capture-roi"),
};
