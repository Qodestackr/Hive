import { registerRoute } from "../utils/route-builder.js";
import {
    CampaignHealthResponseSchema,
    SlowMoversResponseSchema,
    CaptureROIResponseSchema,
    MarginErosionResponseSchema,
    CategoryPerformanceResponseSchema,
    CostTrendsResponseSchema,
    ComplianceSummaryResponseSchema,
} from "../analytics/analytics.schema.js";

/**
 * Analytics API Endpoints
 *
 * Embedded analytics for AI consumption and API delivery.
 * Prescriptive intelligence, not engagement theater.
 */

// Campaign Health Analytics
registerRoute({
    method: "get",
    path: "/api/v1/analytics/campaign-health",
    summary: "Get campaign profit health",
    description:
        "Real-time campaign profitability analysis with loss detection. Prescriptive intelligence that proves outcome-based pricing.",
    tags: ["Analytics", "Profit Intelligence"],
    response: CampaignHealthResponseSchema,
    errors: {
        500: "Database query error",
    },
});

// Slow-Moving Inventory
registerRoute({
    method: "get",
    path: "/api/v1/analytics/slow-movers",
    summary: "Get slow-moving inventory",
    description:
        "Identify products to promote based on velocity and margin. Prescriptive recommendations: PROMOTE_NOW vs AVOID.",
    tags: ["Analytics", "Inventory Intelligence"],
    response: SlowMoversResponseSchema,
    errors: {
        500: "Database query error",
    },
});

// Customer Capture ROI
registerRoute({
    method: "get",
    path: "/api/v1/analytics/capture-roi",
    summary: "Get customer capture ROI",
    description:
        "Prove capture fee value with lifetime profit attribution. Shows which campaigns bring valuable customers.",
    tags: ["Analytics", "Outcome-Based Pricing"],
    response: CaptureROIResponseSchema,
    errors: {
        500: "Database query error",
    },
});

// Margin Erosion Detection
registerRoute({
    method: "get",
    path: "/api/v1/analytics/margin-erosion",
    summary: "Detect margin erosion",
    description:
        "Alert when campaign profit flips from positive to negative mid-campaign. Prevents losses in real-time.",
    tags: ["Analytics", "Profit Intelligence"],
    response: MarginErosionResponseSchema,
    errors: {
        500: "Database query error",
    },
});

// Category Performance
registerRoute({
    method: "get",
    path: "/api/v1/analytics/category-performance",
    summary: "Get category performance",
    description:
        "Identify which product types consistently win in promos. Success rate and profit by category.",
    tags: ["Analytics", "Product Intelligence"],
    response: CategoryPerformanceResponseSchema,
    errors: {
        500: "Database query error",
    },
});

// FIFO Cost Trends
registerRoute({
    method: "get",
    path: "/api/v1/analytics/cost-trends",
    summary: "Get FIFO cost trends",
    description:
        "Track cost increases and recommend purchase timing. BUY_NOW alerts when costs spike and stock is low.",
    tags: ["Analytics", "Purchase Intelligence"],
    response: CostTrendsResponseSchema,
    errors: {
        500: "Database query error",
    },
});

// Compliance Audit Summary
registerRoute({
    method: "get",
    path: "/api/v1/analytics/compliance-summary",
    summary: "Get compliance audit summary",
    description:
        "Prove regulatory compliance to KRA. Monthly event summaries for audit trails.",
    tags: ["Analytics", "Compliance"],
    response: ComplianceSummaryResponseSchema,
    errors: {
        500: "Database query error",
    },
});
