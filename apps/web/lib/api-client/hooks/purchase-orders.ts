import { createQuery, createMutation } from "../factories";
import { purchaseOrders } from "../domains/purchase-orders";

export const usePurchaseOrders = createQuery(
    "purchase-orders",
    purchaseOrders.list
);

// Get single purchase order
export const usePurchaseOrder = createQuery("purchase-order", purchaseOrders.get);

export const useCreatePurchaseOrder = createMutation(purchaseOrders.create, {
    invalidateKeys: ["purchase-orders", "inventory"],
});

export const useUpdatePurchaseOrder = createMutation(purchaseOrders.update, {
    invalidateKeys: ["purchase-orders", "purchase-order", "inventory"],
});

// Quick stock arrival (onboarding flow)
export const useQuickStockArrival = createMutation(
    purchaseOrders.quickArrival,
    {
        invalidateKeys: ["purchase-orders", "inventory"],
    }
);