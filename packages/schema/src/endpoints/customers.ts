import { z } from "zod";
import {
	BulkCustomerImportResponseSchema,
	BulkCustomerImportSchema,
	CustomerAgeVerificationSchema,
	CustomerCreateSchema,
	CustomerListQuerySchema,
	CustomerListResponseSchema,
	CustomerOptInSchema,
	CustomerOptOutSchema,
	CustomerResponseSchema,
	CustomerStatsSchema,
	CustomerUpdateSchema,
} from "../customers/customer.schema.js";
import { registerRoute } from "../utils/route-builder.js";

// Create customer
registerRoute({
	method: "post",
	path: "/api/v1/customers",
	summary: "Create customer",
	description: "Create a new customer record with phone number.",
	tags: ["Customers"],
	body: CustomerCreateSchema,
	response: CustomerResponseSchema,
	errors: {
		400: "Invalid input data",
		409: "Customer with phone number already exists",
	},
});

// Bulk import customers
registerRoute({
	method: "post",
	path: "/api/v1/customers/bulk-import",
	summary: "Bulk import customers",
	description: "Import multiple customers from CSV upload.",
	tags: ["Customers"],
	body: BulkCustomerImportSchema,
	response: BulkCustomerImportResponseSchema,
	errors: {
		400: "Invalid input data",
	},
});

// List customers
registerRoute({
	method: "get",
	path: "/api/v1/customers",
	summary: "List customers",
	description: "Get paginated list of customers with filtering.",
	tags: ["Customers"],
	query: CustomerListQuerySchema,
	response: CustomerListResponseSchema,
	errors: {
		400: "Invalid query parameters",
	},
});

// Get customer by ID
registerRoute({
	method: "get",
	path: "/api/v1/customers/{id}",
	summary: "Get customer by ID",
	description: "Get full customer details.",
	tags: ["Customers"],
	params: z.object({
		id: z
			.string()
			.openapi({ param: { name: "id", in: "path" }, example: "cust_123" }),
	}),
	response: CustomerResponseSchema,
	errors: {
		404: "Customer not found",
	},
});

// Update customer
registerRoute({
	method: "patch",
	path: "/api/v1/customers/{id}",
	summary: "Update customer",
	description: "Update customer details.",
	tags: ["Customers"],
	params: z.object({
		id: z.string().openapi({ param: { name: "id", in: "path" } }),
	}),
	body: CustomerUpdateSchema,
	response: CustomerResponseSchema,
	errors: {
		400: "Invalid input data",
		404: "Customer not found",
	},
});

// Delete customer
registerRoute({
	method: "delete",
	path: "/api/v1/customers/{id}",
	summary: "Delete customer",
	description: "Soft delete a customer.",
	tags: ["Customers"],
	params: z.object({
		id: z.string().openapi({ param: { name: "id", in: "path" } }),
	}),
	response: z.object({ success: z.boolean() }),
	errors: {
		404: "Customer not found",
	},
});

// Verify customer age
registerRoute({
	method: "post",
	path: "/api/v1/customers/{id}/verify-age",
	summary: "Verify customer age",
	description:
		"Record age verification for alcohol compliance (REGULATORY GOLD).",
	tags: ["Customers", "Compliance"],
	params: z.object({
		id: z.string().openapi({ param: { name: "id", in: "path" } }),
	}),
	body: CustomerAgeVerificationSchema,
	response: CustomerResponseSchema,
	errors: {
		400: "Invalid verification data",
		404: "Customer not found",
	},
});

// Customer opt-in
registerRoute({
	method: "post",
	path: "/api/v1/customers/{id}/opt-in",
	summary: "Customer opt-in",
	description: "Record customer consent for marketing communications.",
	tags: ["Customers", "Compliance"],
	params: z.object({
		id: z.string().openapi({ param: { name: "id", in: "path" } }),
	}),
	body: CustomerOptInSchema,
	response: CustomerResponseSchema,
	errors: {
		404: "Customer not found",
	},
});

// Customer opt-out
registerRoute({
	method: "post",
	path: "/api/v1/customers/{id}/opt-out",
	summary: "Customer opt-out",
	description: "Record customer withdrawal from marketing communications.",
	tags: ["Customers", "Compliance"],
	params: z.object({
		id: z.string().openapi({ param: { name: "id", in: "path" } }),
	}),
	body: CustomerOptOutSchema,
	response: CustomerResponseSchema,
	errors: {
		404: "Customer not found",
	},
});

// Get customer stats
registerRoute({
	method: "get",
	path: "/api/v1/customers/stats",
	summary: "Get customer statistics",
	description:
		"Get aggregate customer statistics including LTV and verification rates.",
	tags: ["Customers"],
	response: CustomerStatsSchema,
});
