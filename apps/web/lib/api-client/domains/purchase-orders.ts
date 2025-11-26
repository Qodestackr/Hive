import type { paths } from "@repo/schema/generated/openapi";
import { api } from "../client";

type PurchaseOrderCreate = NonNullable<
	paths["/api/v1/purchase-orders"]["post"]["requestBody"]
>["content"]["application/json"];
type PurchaseOrderUpdate = NonNullable<
	paths["/api/v1/purchase-orders/{id}"]["patch"]["requestBody"]
>["content"]["application/json"];
type QuickStockArrival = NonNullable<
	paths["/api/v1/purchase-orders/quick-arrival"]["post"]["requestBody"]
>["content"]["application/json"];
type PurchaseOrderListQuery =
	paths["/api/v1/purchase-orders"]["get"]["parameters"]["query"];

export const purchaseOrders = {
	list: (query?: PurchaseOrderListQuery) =>
		api.GET("/api/v1/purchase-orders", { params: { query } }),

	get: (id: string) =>
		api.GET("/api/v1/purchase-orders/{id}", {
			params: { path: { id } },
		}),
	create: (data: PurchaseOrderCreate) =>
		api.POST("/api/v1/purchase-orders", { body: data }),
	update: (id: string, data: PurchaseOrderUpdate) =>
		api.PATCH("/api/v1/purchase-orders/{id}", {
			params: { path: { id } },
			body: data,
		}),

	quickArrival: (data: QuickStockArrival) =>
		api.POST("/api/v1/purchase-orders/quick-arrival", { body: data }),
};
