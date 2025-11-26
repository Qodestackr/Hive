import { z } from "zod";
import {
	InventoryMovementListQuerySchema,
	InventoryMovementListResponseSchema,
	ProductFIFOBatchesResponseSchema,
} from "../products/inventory-movement.schema.js";
import { registerRoute } from "../utils/route-builder.js";

// List inventory movements
registerRoute({
	method: "get",
	path: "/api/v1/inventory/movements",
	summary: "List inventory movements",
	description:
		"Get paginated inventory movement history with FIFO cost tracking.",
	tags: ["Inventory", "FIFO"],
	query: InventoryMovementListQuerySchema,
	response: InventoryMovementListResponseSchema,
	errors: {
		400: "Invalid query parameters",
	},
});

// Get FIFO batches for a product
registerRoute({
	method: "get",
	path: "/api/v1/inventory/fifo-batches/{productId}",
	summary: "Get FIFO batches for product",
	description:
		"Show all FIFO batches for a product, ordered by purchase date (FIFO order). Transparency for profit calculations.",
	tags: ["Inventory", "FIFO"],
	params: z.object({
		productId: z.string().openapi({
			param: { name: "productId", in: "path" },
			example: "prod_123",
		}),
	}),
	response: ProductFIFOBatchesResponseSchema,
	errors: {
		404: "Product not found",
	},
});
