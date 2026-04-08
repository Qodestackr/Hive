import { CaptureROIResponseSchema } from "@repo/schema";
import { analyticsService } from "@repo/analytics/services";
import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";

/**
 * GET /api/v1/analytics/capture-roi
 *
 * Business Question: "Are capture fees worth it? Which campaigns bring valuable customers?"
 *
 * Proves outcome-based pricing with receipts.
 * Shows capture fee ROI (e.g., 24x = KES 240 profit per KES 10 fee).
 */
export const GET = createWorkspaceRouteEffect({
    outputSchema: CaptureROIResponseSchema,

    handler: () => analyticsService.getCaptureROIEffect(),

    options: {
        operationName: "getCaptureROI",
        requiredPermissions: ["analytics.view"],
        errorContext: {
            feature: "analytics",
            action: "capture-roi",
        },
    },
});
