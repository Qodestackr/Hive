import { tool } from "ai";
import { z } from "zod";
import { Effect } from "effect";
import { fifoService, productService } from "@repo/services";
import { OrganizationContext } from "@repo/utils";

// Define the input schema for the tool
const InventoryCheckSchema = z.object({
    productId: z.string().describe("The ID of the product to check"),
    organizationId: z.string().describe("The organization ID context"),
});

export const inventoryTool = tool({
    description: "Check the REAL inventory status and FIFO cost of a product. This is the Source of Truth.",
    parameters: InventoryCheckSchema,
    execute: async ({ productId, organizationId }) => {
        // Run the Effect workflow to get data
        const program = Effect.gen(function* () {
            // 1. Get Product Details (Name, Base Price)
            const product = yield* productService.getProductByIdEffect(productId);

            // 2. Get FIFO Batch Data (Real Cost)
            // We check for 1 unit just to get the current batch cost
            const batch = yield* fifoService.getOldestAvailableBatchEffect(productId, 1);

            return {
                productName: product.name,
                currentStock: product.inventoryQuantity,
                basePrice: product.basePrice,
                currentFifoCost: batch.unitCost,
                batchId: batch.batchId,
                status: product.inventoryQuantity > 0 ? "IN_STOCK" : "OUT_OF_STOCK",
            };
        }).pipe(
            // Provide the context
            Effect.provideService(OrganizationContext, { organizationId }),
            // Handle potential errors by returning a structured error object for the AI
            Effect.catchAll((error) =>
                Effect.succeed({
                    error: "FAILED_TO_FETCH_INVENTORY",
                    details: String(error),
                    productId,
                })
            )
        );

        // Execute the Effect
        return Effect.runPromise(program);
    },
});
