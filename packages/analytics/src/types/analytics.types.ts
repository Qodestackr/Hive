/**
 * Analytics Types
 * 
 * Pure TypeScript interfaces for all analytics queries.
 * These are the SINGLE SOURCE OF TRUTH for analytics data shapes.
 * 
 * Pattern: Interface-first design for deterministic contracts
 */

// ============================================================================
// Campaign Health Analytics
// ============================================================================

/**
 * Individual campaign health metrics
 * 
 * Business Question: "Is this campaign making or losing money RIGHT NOW?"
 */
export interface CampaignHealthMetrics {
    id: string;
    name: string;
    status: string;
    redemptions: number;
    totalProfit: number;
    avgProfitPerRedemption: number;
    profitMarginPct: number;
    healthStatus: "🚨 LOSING_MONEY" | "⚠️ LOW_MARGIN" | "✅ HEALTHY";
}

/**
 * Campaign health response with summary
 */
export interface CampaignHealthResponse {
    campaigns: CampaignHealthMetrics[];
    summary: {
        totalCampaigns: number;
        losingMoney: number;
        totalProfit: number;
    };
}

// ============================================================================
// Slow-Moving Inventory Analytics
// ============================================================================

/**
 * Slow-moving product with recommendation
 * 
 * Business Question: "What should I promote to clear stock AND make money?"
 */
export interface SlowMoverProduct {
    id: string;
    name: string;
    category: string | null;
    currentStock: number;
    unitsSold30d: number;
    marginPct: number;
    recommendation: "PROMOTE_NOW" | "MODERATE_PROMO" | "AVOID" | "MOVING_WELL";
}

export interface SlowMoversResponse {
    products: SlowMoverProduct[];
}

// ============================================================================
// Customer Capture ROI Analytics
// ============================================================================

/**
 * Campaign capture ROI metrics
 * 
 * Business Question: "Are capture fees worth it? Which campaigns bring valuable customers?"
 */
export interface CampaignCaptureROI {
    campaignId: string;
    captureCampaign: string;
    customersCaptured: number;
    avgLTV: number;
    totalProfitGenerated: number;
    totalRedemptions: number;
    captureFeeROI: number; // 24x means KES 240 profit per KES 10 capture fee
}

export interface CaptureROIResponse {
    campaigns: CampaignCaptureROI[];
}

// ============================================================================
// Margin Erosion Analytics
// ============================================================================

/**
 * Margin erosion alert
 * 
 * Business Question: "Did my campaign profit flip from positive to negative?"
 */
export interface MarginErosionAlert {
    id: string;
    name: string;
    redemptionDate: string;
    redemptions: number;
    marginPct: number;
    prevMargin: number;
    marginDrop: number; // Negative number
    avgProfit: number;
}

export interface MarginErosionResponse {
    alerts: MarginErosionAlert[];
}

// ============================================================================
// Category Performance Analytics
// ============================================================================

/**
 * Product category performance
 * 
 * Business Question: "Which product types consistently win in promos?"
 */
export interface CategoryPerformance {
    category: string;
    campaignsRun: number;
    profitableCampaigns: number;
    successRatePct: number;
    avgProfitPerRedemption: number;
    totalCategoryProfit: number;
}

export interface CategoryPerformanceResponse {
    categories: CategoryPerformance[];
}

// ============================================================================
// FIFO Cost Trend Analytics
// ============================================================================

/**
 * Product cost trend with recommendations
 * 
 * Business Question: "Are my costs going up? When should I buy more?"
 */
export interface CostTrendProduct {
    id: string;
    name: string;
    category: string | null;
    currentCost: number;
    avgCost90d: number;
    avgCost30d: number;
    costIncreasePct: number;
    currentStockQuantity: number;
    leadTimeDays: number;
    recommendation: "BUY_NOW" | "LOW_STOCK" | "PRICE_SPIKE" | "STABLE";
}

export interface CostTrendsResponse {
    products: CostTrendProduct[];
}

// ============================================================================
// Compliance Audit Analytics
// ============================================================================

/**
 * Compliance log summary
 * 
 * Business Question: "Can I prove to KRA/regulators that I'm compliant?"
 */
export interface ComplianceLogSummary {
    month: string;
    eventType: string;
    eventCount: number;
    uniqueCustomers: number;
}

export interface ComplianceSummaryResponse {
    logs: ComplianceLogSummary[];
}
