import { z } from "zod";
import {
	UserCreateSchema,
	UserResponseSchema,
	UserUpdateSchema,
} from "../auth/user.schema.js";
import { registerRoute } from "../utils/route-builder.js";

// Create user
registerRoute({
	method: "post",
	path: "/api/users",
	summary: "Create a new user",
	tags: ["Users"],
	body: UserCreateSchema,
	response: UserResponseSchema,
	errors: {
		400: "Invalid input data",
	},
});

// Get user by ID
registerRoute({
	method: "get",
	path: "/api/users/{id}",
	summary: "Get user by ID",
	tags: ["Users"],
	params: z.object({
		id: z.string().openapi({
			param: { name: "id", in: "path" },
			example: "123",
		}),
	}),
	response: UserResponseSchema,
	errors: {
		404: "User not found",
	},
});

// Update user
registerRoute({
	method: "patch",
	path: "/api/users/{id}",
	summary: "Update user",
	tags: ["Users"],
	params: z.object({
		id: z.string().openapi({ param: { name: "id", in: "path" } }),
	}),
	body: UserUpdateSchema,
	response: UserResponseSchema,
	errors: {
		400: "Invalid input",
		404: "User not found",
	},
});
