import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";
import { NegotiationIntelQuerySchema, NegotiationIntelResponseSchema } from "@repo/schema";
import { negotiationIntelService } from "@repo/services";

export const GET = createWorkspaceRouteEffect({
    inputSchema: NegotiationIntelQuerySchema,
    outputSchema: NegotiationIntelResponseSchema,
    handler: (data) =>
        negotiationIntelService.generateNegotiationIntelEffect(data.productId),
    options: {
        operationName: "getNegotiationIntel",
        requiredPermissions: ["products.view"],
    },
});
