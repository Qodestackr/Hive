import { z } from "zod";
import { ID, Timestamps } from "../shared/base.schema.js";

// Schema with OpenAPI metadata
export const UserCreateSchema = z
	.object({
		email: z.string().email().openapi({
			example: "user@example.com",
			description: "User email address",
		}),
		name: z.string().min(1).openapi({
			example: "John Doe",
			description: "Full name of the user",
		}),
		password: z.string().min(8).openapi({
			example: "SecurePass123!",
			description: "Password (minimum 8 characters)",
		}),
	})
	.openapi("UserCreate"); // Register it!

export const UserUpdateSchema = z
	.object({
		name: z.string().optional().openapi({ example: "Jane Doe" }),
		password: z.string().min(8).optional().openapi({ example: "NewPass123!" }),
	})
	.openapi("UserUpdate");

export const UserResponseSchema = z
	.object({
		id: ID,
		email: z.string().openapi({ example: "user@example.com" }),
		name: z.string().openapi({ example: "John Doe" }),
	})
	.merge(Timestamps)
	.openapi("UserResponse");

export type UserCreateInput = z.infer<typeof UserCreateSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
