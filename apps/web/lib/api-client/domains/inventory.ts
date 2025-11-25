import { api } from "../client";
import type { paths } from "@repo/schema/generated/openapi";

type InventoryMovementListQuery = paths["/api/v1/inventory/movements"]["get"]["parameters"]["query"];

export const inventory = {
    // List inventory movements with filtering
    movements: (query?: InventoryMovementListQuery) =>
        api.GET("/api/v1/inventory/movements", { params: { query } }),
    
    fifoBatches: (productId: string) =>
        api.GET("/api/v1/inventory/fifo-batches/{productId}", {
            params: { path: { productId } },
        }),
};
