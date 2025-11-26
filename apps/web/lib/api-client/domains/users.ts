import type { paths } from "@repo/schema/generated/openapi";
import { api } from "../client";

type UserCreate = NonNullable<
	paths["/api/users"]["post"]["requestBody"]
>["content"]["application/json"];
type UserUpdate = NonNullable<
	paths["/api/users/{id}"]["patch"]["requestBody"]
>["content"]["application/json"];

export const users = {
	create: (data: UserCreate) => api.POST("/api/users", { body: data }),

	get: (id: string) =>
		api.GET("/api/users/{id}", {
			params: { path: { id } },
		}),

	update: (id: string, data: UserUpdate) =>
		api.PATCH("/api/users/{id}", {
			params: { path: { id } },
			body: data,
		}),
};
