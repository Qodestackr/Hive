import { z } from "zod";
import { registerRoute } from "../utils/route-builder.js";
import {
    QuickStockArrivalSchema,
    PurchaseOrderCreateSchema,
    PurchaseOrderUpdateSchema,
    PurchaseOrderListQuerySchema,
    PurchaseOrderResponseSchema,
    PurchaseOrderListResponseSchema,
} from "../products/purchase-order.schema.js";

// ============================================================================
// PURCHASE ORDER ENDPOINTS (THE GOLD - FIFO Cost Tracking)
// ============================================================================

// Quick stock arrival (30-second stock entry)
registerRoute({
    method: 'post',
    path: '/api/v1/purchase-orders/quick-arrival',
    summary: 'Quick stock arrival entry',
    description: 'Simplified stock entry for onboarding. Creates PO and updates FIFO batches in one step.',
    tags: ['Purchase Orders', 'FIFO'],
    body: QuickStockArrivalSchema,
    response: PurchaseOrderResponseSchema,
    errors: {
        400: 'Invalid input data',
        404: 'Product not found',
    },
});

// Create purchase order
registerRoute({
    method: 'post',
    path: '/api/v1/purchase-orders',
    summary: 'Create purchase order',
    description: 'Create a full purchase order with multiple line items.',
    tags: ['Purchase Orders'],
    body: PurchaseOrderCreateSchema,
    response: PurchaseOrderResponseSchema,
    errors: {
        400: 'Invalid input data',
        404: 'Product not found',
    },
});

// List purchase orders
registerRoute({
    method: 'get',
    path: '/api/v1/purchase-orders',
    summary: 'List purchase orders',
    description: 'Get paginated list of purchase orders with filtering.',
    tags: ['Purchase Orders'],
    query: PurchaseOrderListQuerySchema,
    response: PurchaseOrderListResponseSchema,
    errors: {
        400: 'Invalid query parameters',
    },
});

// Get purchase order by ID
registerRoute({
    method: 'get',
    path: '/api/v1/purchase-orders/{id}',
    summary: 'Get purchase order by ID',
    description: 'Get full purchase order details including line items.',
    tags: ['Purchase Orders'],
    params: z.object({
        id: z.string().openapi({ param: { name: 'id', in: 'path' }, example: 'po_123' }),
    }),
    response: PurchaseOrderResponseSchema,
    errors: {
        404: 'Purchase order not found',
    },
});

// Update purchase order
registerRoute({
    method: 'patch',
    path: '/api/v1/purchase-orders/{id}',
    summary: 'Update purchase order',
    description: 'Update purchase order status or details.',
    tags: ['Purchase Orders'],
    params: z.object({
        id: z.string().openapi({ param: { name: 'id', in: 'path' } }),
    }),
    body: PurchaseOrderUpdateSchema,
    response: PurchaseOrderResponseSchema,
    errors: {
        400: 'Invalid input data',
        404: 'Purchase order not found',
    },
});
