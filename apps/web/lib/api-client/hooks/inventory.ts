import { createQuery } from "../factories";
import { inventory } from "../domains/inventory";

// List inventory movements
export const useInventoryMovements = createQuery(
    "inventory-movements",
    inventory.movements
);

export const useFIFOBatches = createQuery("fifo-batches", inventory.fifoBatches);
