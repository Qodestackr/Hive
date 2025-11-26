import { z } from "zod";
import {
	BulkProductPriceUpdateSchema,
	ProductCreateSchema,
	ProductListQuerySchema,
	ProductListResponseSchema,
	ProductPriceUpdateSchema,
	ProductResponseSchema,
	ProductUpdateSchema,
} from "../products/product.schema.js";
import { registerRoute } from "../utils/route-builder.js";

// Create product
registerRoute({
	method: "post",
	path: "/api/v1/products",
	summary: "Create product",
	description: "Create a new product in the catalog.",
	tags: ["Products"],
	body: ProductCreateSchema,
	response: ProductResponseSchema,
	errors: {
		400: "Invalid input data",
		409: "Product with SKU already exists",
	},
});

// List products
registerRoute({
	method: "get",
	path: "/api/v1/products",
	summary: "List products",
	description: "Get paginated list of products with filtering and sorting.",
	tags: ["Products"],
	query: ProductListQuerySchema,
	response: ProductListResponseSchema,
	errors: {
		400: "Invalid query parameters",
	},
});

// Get product by ID
registerRoute({
	method: "get",
	path: "/api/v1/products/{id}",
	summary: "Get product by ID",
	description: "Get full product details including current FIFO cost.",
	tags: ["Products"],
	params: z.object({
		id: z
			.string()
			.openapi({ param: { name: "id", in: "path" }, example: "prod_123" }),
	}),
	response: ProductResponseSchema,
	errors: {
		404: "Product not found",
	},
});

// Update product
registerRoute({
	method: "patch",
	path: "/api/v1/products/{id}",
	summary: "Update product",
	description: "Update product details.",
	tags: ["Products"],
	params: z.object({
		id: z.string().openapi({ param: { name: "id", in: "path" } }),
	}),
	body: ProductUpdateSchema,
	response: ProductResponseSchema,
	errors: {
		400: "Invalid input data",
		404: "Product not found",
		409: "SKU already exists",
	},
});

// Delete product
registerRoute({
	method: "delete",
	path: "/api/v1/products/{id}",
	summary: "Delete product",
	description: "Soft delete a product (marks as inactive).",
	tags: ["Products"],
	params: z.object({
		id: z.string().openapi({ param: { name: "id", in: "path" } }),
	}),
	response: z.object({ success: z.boolean() }),
	errors: {
		404: "Product not found",
	},
});

// Quick price update
registerRoute({
	method: "patch",
	path: "/api/v1/products/{id}/price",
	summary: "Update product price",
	description: "Quick update of product price and stock (for onboarding).",
	tags: ["Products"],
	params: z.object({
		id: z.string().openapi({ param: { name: "id", in: "path" } }),
	}),
	body: ProductPriceUpdateSchema,
	response: ProductResponseSchema,
	errors: {
		400: "Invalid input data",
		404: "Product not found",
	},
});

// Bulk price update
registerRoute({
	method: "post",
	path: "/api/v1/products/bulk-price-update",
	summary: "Bulk price update",
	description: "Update prices for multiple products at once.",
	tags: ["Products"],
	body: BulkProductPriceUpdateSchema,
	response: z.object({ updated: z.number().int() }),
	errors: {
		400: "Invalid input data",
	},
});

// Get FIFO batches for product
registerRoute({
	method: "get",
	path: "/api/v1/products/{id}/fifo-batches",
	summary: "Get FIFO batches",
	description:
		"Get inventory movement batches for debugging FIFO calculations.",
	tags: ["Products", "FIFO"],
	params: z.object({
		id: z.string().openapi({ param: { name: "id", in: "path" } }),
	}),
	response: z.object({
		productId: z.string(),
		batches: z.array(z.any()),
		totalQuantity: z.number(),
	}),
	errors: {
		404: "Product not found",
	},
});
