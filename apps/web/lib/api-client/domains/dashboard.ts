import type { paths } from "@repo/schema/generated/openapi";
import { api } from "../client";

type DashboardQuery =
    paths["/api/v1/dashboard/overview"]["get"]["parameters"]["query"];

export const dashboard = {
    overview: (query?: DashboardQuery) =>
        api.GET("/api/v1/dashboard/overview", { params: { query } }),
};
