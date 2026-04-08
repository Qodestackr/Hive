import { z } from "zod";

export const InventoryCheckSchema = z.object({
    productId: z.string(),
    organizationId: z.string(),
});

export type InventoryCheckInput = z.infer<typeof InventoryCheckSchema>;
