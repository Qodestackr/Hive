import type { paths } from "@repo/schema/generated/openapi";
import { api } from "../client";

type CampaignCreate = NonNullable<
	paths["/api/v1/campaigns"]["post"]["requestBody"]
>["content"]["application/json"];
type CampaignUpdate = NonNullable<
	paths["/api/v1/campaigns/{id}"]["patch"]["requestBody"]
>["content"]["application/json"];
type CampaignListQuery =
	paths["/api/v1/campaigns"]["get"]["parameters"]["query"];
type ProfitabilityCheck = NonNullable<
	paths["/api/v1/campaigns/profit-check"]["post"]["requestBody"]
>["content"]["application/json"];

export const campaigns = {
	list: (query?: CampaignListQuery) =>
		api.GET("/api/v1/campaigns", { params: { query } }),

	get: (id: string) =>
		api.GET("/api/v1/campaigns/{id}", {
			params: { path: { id } },
		}),

	create: (data: CampaignCreate) =>
		api.POST("/api/v1/campaigns", { body: data }),

	update: (id: string, data: CampaignUpdate) =>
		api.PATCH("/api/v1/campaigns/{id}", {
			params: { path: { id } },
			body: data,
		}),

	stats: (id: string) =>
		api.GET("/api/v1/campaigns/{id}/stats", {
			params: { path: { id } },
		}),

	checkProfitability: (data: ProfitabilityCheck) =>
		api.POST("/api/v1/campaigns/profit-check", { body: data }),
};
