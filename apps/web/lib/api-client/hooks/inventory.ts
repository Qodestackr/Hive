import { inventory } from "../domains/inventory";
import { createQuery } from "../factories";

// List inventory movements
export const useInventoryMovements = createQuery(
	"inventory-movements",
	inventory.movements,
);

export const useFIFOBatches = createQuery(
	"fifo-batches",
	inventory.fifoBatches,
);
