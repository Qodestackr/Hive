import type { paths } from "@repo/schema/generated/openapi";
import { api } from "../client";

type PromoCodeCreate = NonNullable<
	paths["/api/v1/promo-codes"]["post"]["requestBody"]
>["content"]["application/json"];
type PromoCodeRedeem = NonNullable<
	paths["/api/v1/promo-codes/redeem"]["post"]["requestBody"]
>["content"]["application/json"];
type PromoCodeValidate = NonNullable<
	paths["/api/v1/promo-codes/validate"]["post"]["requestBody"]
>["content"]["application/json"];
type BulkPromoCodeCreate = NonNullable<
	paths["/api/v1/promo-codes/bulk"]["post"]["requestBody"]
>["content"]["application/json"];
type PromoCodeListQuery =
	paths["/api/v1/promo-codes"]["get"]["parameters"]["query"];

export const promoCodes = {
	// List promo codes with filtering
	list: (query?: PromoCodeListQuery) =>
		api.GET("/api/v1/promo-codes", { params: { query } }),

	get: (id: string) =>
		api.GET("/api/v1/promo-codes/{id}", {
			params: { path: { id } },
		}),

	create: (data: PromoCodeCreate) =>
		api.POST("/api/v1/promo-codes", { body: data }),

	bulkCreate: (data: BulkPromoCodeCreate) =>
		api.POST("/api/v1/promo-codes/bulk", { body: data }),

	// Redeem promo code (calculates profit with FIFO)
	redeem: (data: PromoCodeRedeem) =>
		api.POST("/api/v1/promo-codes/redeem", { body: data }),

	// Validate promo code without redeeming
	validate: (data: PromoCodeValidate) =>
		api.POST("/api/v1/promo-codes/validate", { body: data }),
};
