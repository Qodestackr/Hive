# DuckDB Analytics Architecture for Promco

**Version:** 1.0  
**Last Updated:** November 27, 2025  
**Purpose:** Strategic separation between OLTP (Postgres) and OLAP (DuckDB) for profit intelligence analytics

---

## Table of Contents

1. [The Core Principle](#the-core-principle)
2. [Architecture Overview](#architecture-overview)
3. [The 7 Analytics That Matter](#the-7-analytics-that-matter)
4. [Implementation Strategy](#implementation-strategy)
5. [API Design](#api-design)
6. [AI Insight Generation](#ai-insight-generation)
7. [What NOT to Build](#what-not-to-build)

---

## The Core Principle

**Stop doing analytics on Postgres. Use DuckDB for all aggregations.**

### Why?

- **Postgres (OLTP):** Row-oriented, optimized for transactions (inserts, updates, point queries)
- **DuckDB (OLAP):** Column-oriented, optimized for aggregations (SUM, AVG, GROUP BY on millions of rows)

### The Stack

```
┌──────────────────────────────────────────────┐
│  Neon Postgres (Primary DB)                 │
│  - Campaigns, promoCodes, customers          │
│  - pg_duckdb extension installed             │
└────────────┬─────────────────────────────────┘
             │
             ├─> Write: Normal Postgres (OLTP)
             │   INSERT INTO campaigns ...
             │   UPDATE promoCodes SET isRedeemed = true ...
             │
             └─> Read Analytics: DuckDB execution (OLAP)
                 SELECT SUM(actualProfit), AVG(...) ...
                 (automatically accelerated via pg_duckdb)
```

**Key Insight:** With Neon's `pg_duckdb` extension, you query Postgres tables using normal SQL, and DuckDB automatically accelerates heavy aggregations.

---

## Architecture Overview

### File Structure

```
packages/
├── analytics/
│   ├── src/
│   │   ├── services/
│   │   │   ├── duckdb-analytics.service.ts    # Core DuckDB queries
│   │   │   ├── insight-generator.service.ts   # AI-powered insights
│   │   │   └── whatsapp-insights.service.ts   # WhatsApp delivery
│   │   ├── routes/
│   │   │   └── analytics.routes.ts            # API endpoints
│   │   └── types/
│   │       └── analytics.types.ts             # TypeScript interfaces
│   └── package.json
└── db/
    └── src/
        └── current-schema.ts                   # Source of truth (Postgres)
```

### Data Flow

```
┌─────────────┐
│   User      │
│  Action     │  (Redeems promo code)
└──────┬──────┘
       │
       ↓
┌──────────────────────┐
│  Postgres (OLTP)     │  INSERT INTO promoCodes (isRedeemed = true, actualProfit = 420)
└──────┬───────────────┘
       │
       │ (DuckDB reads from Postgres tables automatically)
       │
       ↓
┌──────────────────────┐
│  DuckDB (OLAP)       │  SELECT SUM(actualProfit) FROM promoCodes WHERE campaignId = X
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│  AI Insight Gen      │  Claude API: "Campaign X made KES 45K this week"
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│  WhatsApp Message    │  "📊 Campaign Alert: Jameson promo up 18% vs last week"
└──────────────────────┘
```

---

## The 7 Analytics That Matter

### 1. Campaign Profit Health (Real-Time Decision)

**Business Question:** "Is this campaign making or losing money RIGHT NOW?"

**DuckDB Query:**

```sql
-- packages/analytics/src/queries/campaign-health.sql
SELECT 
    c.id,
    c.name,
    c.status,
    COUNT(pc.id) as redemptions,
    SUM(pc."actualProfit") as total_profit,
    AVG(pc."actualProfit") as avg_profit_per_redemption,
    (SUM(pc."actualProfit") / NULLIF(SUM(pc."netRevenue"), 0)) * 100 as profit_margin_pct,
    CASE 
        WHEN SUM(pc."actualProfit") < 0 THEN '🚨 LOSING_MONEY'
        WHEN AVG(pc."actualProfit") < 100 THEN '⚠️ LOW_MARGIN'
        ELSE '✅ HEALTHY'
    END as health_status
FROM campaigns c
JOIN "promoCodes" pc ON pc."campaignId" = c.id
WHERE pc."isRedeemed" = true
  AND c."organizationId" = $1
  AND c.status = 'active'
GROUP BY c.id, c.name, c.status
ORDER BY total_profit ASC;
```

**API Response Shape:**

```typescript
interface CampaignHealthResponse {
  campaigns: Array<{
    id: string;
    name: string;
    redemptions: number;
    totalProfit: number;
    avgProfitPerRedemption: number;
    profitMarginPct: number;
    healthStatus: '🚨 LOSING_MONEY' | '⚠️ LOW_MARGIN' | '✅ HEALTHY';
  }>;
  summary: {
    totalCampaigns: number;
    losingMoney: number;
    totalProfit: number;
  };
}
```

---

### 2. Slow-Moving Inventory with Profit Context

**Business Question:** "What should I promote to clear stock AND make money?"

**DuckDB Query:**

```sql
-- packages/analytics/src/queries/slow-movers.sql
WITH inventory_velocity AS (
    SELECT 
        p.id,
        p.name,
        p.category,
        p."currentStockQuantity" as current_stock,
        p."basePrice",
        p."currentFIFOCost",
        (p."basePrice" - p."currentFIFOCost") / NULLIF(p."basePrice", 0) * 100 as margin_pct,
        COUNT(im.id) FILTER (
            WHERE im."movementType" = 'sale' 
            AND im."createdAt" >= CURRENT_DATE - INTERVAL '30 days'
        ) as units_sold_30d
    FROM products p
    LEFT JOIN "inventoryMovements" im ON im."productId" = p.id
    WHERE p."organizationId" = $1
      AND p."isActive" = true
    GROUP BY p.id
)
SELECT 
    id,
    name,
    category,
    current_stock,
    units_sold_30d,
    ROUND(margin_pct::numeric, 2) as margin_pct,
    CASE 
        WHEN units_sold_30d < 10 AND margin_pct > 35 THEN 'PROMOTE_NOW'
        WHEN units_sold_30d < 10 AND margin_pct BETWEEN 20 AND 35 THEN 'MODERATE_PROMO'
        WHEN units_sold_30d < 10 AND margin_pct < 20 THEN 'AVOID'
        ELSE 'MOVING_WELL'
    END as recommendation
FROM inventory_velocity
WHERE units_sold_30d < 50 OR current_stock > 100
ORDER BY 
    CASE 
        WHEN units_sold_30d < 10 AND margin_pct > 35 THEN 1
        WHEN units_sold_30d < 10 AND margin_pct BETWEEN 20 AND 35 THEN 2
        ELSE 3
    END,
    margin_pct DESC
LIMIT 20;
```

**API Response Shape:**

```typescript
interface SlowMoversResponse {
  products: Array<{
    id: string;
    name: string;
    category: string;
    currentStock: number;
    unitsSold30d: number;
    marginPct: number;
    recommendation: 'PROMOTE_NOW' | 'MODERATE_PROMO' | 'AVOID' | 'MOVING_WELL';
  }>;
}
```

---

### 3. Customer Capture ROI (Outcome-Based Proof)

**Business Question:** "Are capture fees worth it? Which campaigns bring valuable customers?"

**DuckDB Query:**

```sql
-- packages/analytics/src/queries/capture-roi.sql
WITH customer_ltv AS (
    SELECT 
        c.id,
        c."optInCampaignId",
        c."createdAt" as captured_at,
        COUNT(pc.id) as total_redemptions,
        SUM(pc."netRevenue") as lifetime_revenue,
        SUM(pc."actualProfit") as lifetime_profit
    FROM customers c
    LEFT JOIN "promoCodes" pc ON pc."customerId" = c.id AND pc."isRedeemed" = true
    WHERE c."organizationId" = $1
      AND c."createdAt" >= CURRENT_DATE - INTERVAL '90 days'
    GROUP BY c.id
)
SELECT 
    cam.id as campaign_id,
    cam.name as capture_campaign,
    COUNT(ltv.id) as customers_captured,
    ROUND(AVG(ltv.lifetime_profit)::numeric, 2) as avg_ltv,
    SUM(ltv.lifetime_profit) as total_profit_generated,
    SUM(ltv.total_redemptions) as total_redemptions,
    -- Calculate capture fee ROI (KES 10 per capture)
    ROUND((SUM(ltv.lifetime_profit) / NULLIF(COUNT(ltv.id) * 10, 0))::numeric, 2) as capture_fee_roi
FROM customer_ltv ltv
LEFT JOIN campaigns cam ON cam.id = ltv."optInCampaignId"
WHERE cam.id IS NOT NULL
GROUP BY cam.id, cam.name
HAVING COUNT(ltv.id) > 0
ORDER BY total_profit_generated DESC
LIMIT 10;
```

**API Response Shape:**

```typescript
interface CaptureROIResponse {
  campaigns: Array<{
    campaignId: string;
    captureCampaign: string;
    customersCaptured: number;
    avgLTV: number;
    totalProfitGenerated: number;
    totalRedemptions: number;
    captureFeeROI: number; // 24x means KES 240 profit per KES 10 capture fee
  }>;
}
```

---

### 4. Margin Erosion Detection (Mid-Campaign)

**Business Question:** "Did my campaign profit flip from positive to negative?"

**DuckDB Query:**

```sql
-- packages/analytics/src/queries/margin-erosion.sql
WITH daily_margin AS (
    SELECT 
        c.id,
        c.name,
        DATE(pc."redeemedAt") as redemption_date,
        COUNT(pc.id) as redemptions,
        AVG(pc."actualProfit") as avg_profit,
        (SUM(pc."actualProfit") / NULLIF(SUM(pc."netRevenue"), 0)) * 100 as margin_pct
    FROM campaigns c
    JOIN "promoCodes" pc ON pc."campaignId" = c.id
    WHERE pc."isRedeemed" = true
      AND c."organizationId" = $1
      AND c.status = 'active'
      AND pc."redeemedAt" >= CURRENT_DATE - INTERVAL '14 days'
    GROUP BY c.id, c.name, DATE(pc."redeemedAt")
),
margin_change AS (
    SELECT 
        *,
        LAG(margin_pct) OVER (PARTITION BY id ORDER BY redemption_date) as prev_margin,
        margin_pct - LAG(margin_pct) OVER (PARTITION BY id ORDER BY redemption_date) as margin_drop
    FROM daily_margin
)
SELECT 
    id,
    name,
    redemption_date,
    redemptions,
    ROUND(margin_pct::numeric, 2) as margin_pct,
    ROUND(prev_margin::numeric, 2) as prev_margin,
    ROUND(margin_drop::numeric, 2) as margin_drop,
    ROUND(avg_profit::numeric, 2) as avg_profit
FROM margin_change
WHERE margin_drop < -5  -- Alert if margin drops >5 percentage points
ORDER BY redemption_date DESC, margin_drop ASC;
```

**API Response Shape:**

```typescript
interface MarginErosionResponse {
  alerts: Array<{
    id: string;
    name: string;
    redemptionDate: string;
    redemptions: number;
    marginPct: number;
    prevMargin: number;
    marginDrop: number; // Negative number
    avgProfit: number;
  }>;
}
```

---

### 5. Product Category Performance

**Business Question:** "Which product types consistently win in promos?"

**DuckDB Query:**

```sql
-- packages/analytics/src/queries/category-performance.sql
SELECT 
    p.category,
    COUNT(DISTINCT c.id) as campaigns_run,
    COUNT(DISTINCT CASE WHEN c."actualProfit" > 0 THEN c.id END) as profitable_campaigns,
    ROUND(
        (COUNT(DISTINCT CASE WHEN c."actualProfit" > 0 THEN c.id END)::FLOAT / 
         NULLIF(COUNT(DISTINCT c.id), 0)) * 100, 
        2
    ) as success_rate_pct,
    ROUND(AVG(pc."actualProfit")::numeric, 2) as avg_profit_per_redemption,
    SUM(pc."actualProfit") as total_category_profit
FROM campaigns c
JOIN "promoCodes" pc ON pc."campaignId" = c.id
JOIN products p ON p.id = pc."productId"
WHERE pc."isRedeemed" = true
  AND c."organizationId" = $1
  AND c."createdAt" >= CURRENT_DATE - INTERVAL '180 days'
GROUP BY p.category
ORDER BY success_rate_pct DESC, total_category_profit DESC;
```

**API Response Shape:**

```typescript
interface CategoryPerformanceResponse {
  categories: Array<{
    category: string;
    campaignsRun: number;
    profitableCampaigns: number;
    successRatePct: number;
    avgProfitPerRedemption: number;
    totalCategoryProfit: number;
  }>;
}
```

---

### 6. FIFO Cost Trend (Purchase Intelligence)

**Business Question:** "Are my costs going up? When should I buy more?"

**DuckDB Query:**

```sql
-- packages/analytics/src/queries/cost-trends.sql
WITH cost_trends AS (
    SELECT 
        p.id,
        p.name,
        p.category,
        p."currentFIFOCost" as current_cost,
        AVG(poi."unitCost") FILTER (
            WHERE po."orderDate" >= CURRENT_DATE - INTERVAL '90 days'
        ) as avg_cost_90d,
        AVG(poi."unitCost") FILTER (
            WHERE po."orderDate" >= CURRENT_DATE - INTERVAL '30 days'
        ) as avg_cost_30d,
        p."currentStockQuantity",
        p."leadTimeDays"
    FROM products p
    LEFT JOIN "purchaseOrderItems" poi ON poi."productId" = p.id
    LEFT JOIN "purchaseOrders" po ON po.id = poi."purchaseOrderId"
    WHERE p."organizationId" = $1
      AND p."isActive" = true
    GROUP BY p.id
)
SELECT 
    id,
    name,
    category,
    ROUND(current_cost::numeric, 2) as current_cost,
    ROUND(avg_cost_90d::numeric, 2) as avg_cost_90d,
    ROUND(avg_cost_30d::numeric, 2) as avg_cost_30d,
    ROUND(
        ((avg_cost_30d - avg_cost_90d) / NULLIF(avg_cost_90d, 0)) * 100, 
        2
    ) as cost_increase_pct,
    "currentStockQuantity",
    "leadTimeDays",
    CASE 
        WHEN "currentStockQuantity" < 20 AND ((avg_cost_30d - avg_cost_90d) / NULLIF(avg_cost_90d, 0)) * 100 > 10 
            THEN 'BUY_NOW'
        WHEN "currentStockQuantity" < 20 THEN 'LOW_STOCK'
        WHEN ((avg_cost_30d - avg_cost_90d) / NULLIF(avg_cost_90d, 0)) * 100 > 15 
            THEN 'PRICE_SPIKE'
        ELSE 'STABLE'
    END as recommendation
FROM cost_trends
WHERE avg_cost_90d IS NOT NULL
ORDER BY cost_increase_pct DESC NULLS LAST, "currentStockQuantity" ASC
LIMIT 20;
```

**API Response Shape:**

```typescript
interface CostTrendsResponse {
  products: Array<{
    id: string;
    name: string;
    category: string;
    currentCost: number;
    avgCost90d: number;
    avgCost30d: number;
    costIncreasePct: number;
    currentStockQuantity: number;
    leadTimeDays: number;
    recommendation: 'BUY_NOW' | 'LOW_STOCK' | 'PRICE_SPIKE' | 'STABLE';
  }>;
}
```

---

### 7. Compliance Audit Summary

**Business Question:** "Can I prove to KRA/regulators that I'm compliant?"

**DuckDB Query:**

```sql
-- packages/analytics/src/queries/compliance-summary.sql
SELECT 
    DATE_TRUNC('month', cl."createdAt") as month,
    cl."eventType",
    COUNT(*) as event_count,
    COUNT(DISTINCT cl."customerId") as unique_customers
FROM "complianceLogs" cl
WHERE cl."organizationId" = $1
  AND cl."createdAt" >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', cl."createdAt"), cl."eventType"
ORDER BY month DESC, event_count DESC;
```

**API Response Shape:**

```typescript
interface ComplianceSummaryResponse {
  logs: Array<{
    month: string;
    eventType: string;
    eventCount: number;
    uniqueCustomers: number;
  }>;
}
```

---

## Implementation Strategy

### Service Layer Architecture

```typescript
// packages/analytics/src/services/duckdb-analytics.service.ts

import { neon } from '@neondatabase/serverless';
import type {
  CampaignHealthResponse,
  SlowMoversResponse,
  CaptureROIResponse,
  MarginErosionResponse,
  CategoryPerformanceResponse,
  CostTrendsResponse,
  ComplianceSummaryResponse
} from '../types/analytics.types';

export class DuckDBAnalyticsService {
  private sql = neon(process.env.DATABASE_URL!);

  /**
   * Get real-time campaign profit health
   * Uses DuckDB for fast aggregation across thousands of promo codes
   */
  async getCampaignHealth(organizationId: string): Promise<CampaignHealthResponse> {
    const campaigns = await this.sql`
      SELECT 
        c.id,
        c.name,
        c.status,
        COUNT(pc.id)::int as redemptions,
        SUM(pc."actualProfit")::float as total_profit,
        AVG(pc."actualProfit")::float as avg_profit_per_redemption,
        (SUM(pc."actualProfit") / NULLIF(SUM(pc."netRevenue"), 0)) * 100 as profit_margin_pct,
        CASE 
          WHEN SUM(pc."actualProfit") < 0 THEN '🚨 LOSING_MONEY'
          WHEN AVG(pc."actualProfit") < 100 THEN '⚠️ LOW_MARGIN'
          ELSE '✅ HEALTHY'
        END as health_status
      FROM campaigns c
      JOIN "promoCodes" pc ON pc."campaignId" = c.id
      WHERE pc."isRedeemed" = true
        AND c."organizationId" = ${organizationId}
        AND c.status = 'active'
      GROUP BY c.id, c.name, c.status
      ORDER BY total_profit ASC;
    `;

    const summary = {
      totalCampaigns: campaigns.length,
      losingMoney: campaigns.filter(c => c.health_status === '🚨 LOSING_MONEY').length,
      totalProfit: campaigns.reduce((sum, c) => sum + (c.total_profit || 0), 0)
    };

    return { campaigns, summary };
  }

  /**
   * Get slow-moving inventory with profit context
   * Helps distributors decide what to promote
   */
  async getSlowMovers(organizationId: string): Promise<SlowMoversResponse> {
    const products = await this.sql`
      WITH inventory_velocity AS (
        SELECT 
          p.id,
          p.name,
          p.category,
          p."currentStockQuantity" as current_stock,
          p."basePrice",
          p."currentFIFOCost",
          (p."basePrice" - p."currentFIFOCost") / NULLIF(p."basePrice", 0) * 100 as margin_pct,
          COUNT(im.id) FILTER (
            WHERE im."movementType" = 'sale' 
            AND im."createdAt" >= CURRENT_DATE - INTERVAL '30 days'
          )::int as units_sold_30d
        FROM products p
        LEFT JOIN "inventoryMovements" im ON im."productId" = p.id
        WHERE p."organizationId" = ${organizationId}
          AND p."isActive" = true
        GROUP BY p.id
      )
      SELECT 
        id,
        name,
        category,
        current_stock,
        units_sold_30d,
        ROUND(margin_pct::numeric, 2)::float as margin_pct,
        CASE 
          WHEN units_sold_30d < 10 AND margin_pct > 35 THEN 'PROMOTE_NOW'
          WHEN units_sold_30d < 10 AND margin_pct BETWEEN 20 AND 35 THEN 'MODERATE_PROMO'
          WHEN units_sold_30d < 10 AND margin_pct < 20 THEN 'AVOID'
          ELSE 'MOVING_WELL'
        END as recommendation
      FROM inventory_velocity
      WHERE units_sold_30d < 50 OR current_stock > 100
      ORDER BY 
        CASE 
          WHEN units_sold_30d < 10 AND margin_pct > 35 THEN 1
          WHEN units_sold_30d < 10 AND margin_pct BETWEEN 20 AND 35 THEN 2
          ELSE 3
        END,
        margin_pct DESC
      LIMIT 20;
    `;

    return { products };
  }

  /**
   * Get customer capture ROI
   * Proves outcome-based pricing value
   */
  async getCaptureROI(organizationId: string): Promise<CaptureROIResponse> {
    const campaigns = await this.sql`
      WITH customer_ltv AS (
        SELECT 
          c.id,
          c."optInCampaignId",
          c."createdAt" as captured_at,
          COUNT(pc.id)::int as total_redemptions,
          SUM(pc."netRevenue")::float as lifetime_revenue,
          SUM(pc."actualProfit")::float as lifetime_profit
        FROM customers c
        LEFT JOIN "promoCodes" pc ON pc."customerId" = c.id AND pc."isRedeemed" = true
        WHERE c."organizationId" = ${organizationId}
          AND c."createdAt" >= CURRENT_DATE - INTERVAL '90 days'
        GROUP BY c.id
      )
      SELECT 
        cam.id as campaign_id,
        cam.name as capture_campaign,
        COUNT(ltv.id)::int as customers_captured,
        ROUND(AVG(ltv.lifetime_profit)::numeric, 2)::float as avg_ltv,
        SUM(ltv.lifetime_profit)::float as total_profit_generated,
        SUM(ltv.total_redemptions)::int as total_redemptions,
        ROUND((SUM(ltv.lifetime_profit) / NULLIF(COUNT(ltv.id) * 10, 0))::numeric, 2)::float as capture_fee_roi
      FROM customer_ltv ltv
      LEFT JOIN campaigns cam ON cam.id = ltv."optInCampaignId"
      WHERE cam.id IS NOT NULL
      GROUP BY cam.id, cam.name
      HAVING COUNT(ltv.id) > 0
      ORDER BY total_profit_generated DESC
      LIMIT 10;
    `;

    return { campaigns };
  }

  /**
   * Detect margin erosion mid-campaign
   * Alerts when FIFO cost changes destroy profitability
   */
  async getMarginErosion(organizationId: string): Promise<MarginErosionResponse> {
    const alerts = await this.sql`
      WITH daily_margin AS (
        SELECT 
          c.id,
          c.name,
          DATE(pc."redeemedAt") as redemption_date,
          COUNT(pc.id)::int as redemptions,
          AVG(pc."actualProfit")::float as avg_profit,
          (SUM(pc."actualProfit") / NULLIF(SUM(pc."netRevenue"), 0)) * 100 as margin_pct
        FROM campaigns c
        JOIN "promoCodes" pc ON pc."campaignId" = c.id
        WHERE pc."isRedeemed" = true
          AND c."organizationId" = ${organizationId}
          AND c.status = 'active'
          AND pc."redeemedAt" >= CURRENT_DATE - INTERVAL '14 days'
        GROUP BY c.id, c.name, DATE(pc."redeemedAt")
      ),
      margin_change AS (
        SELECT 
          *,
          LAG(margin_pct) OVER (PARTITION BY id ORDER BY redemption_date) as prev_margin,
          margin_pct - LAG(margin_pct) OVER (PARTITION BY id ORDER BY redemption_date) as margin_drop
        FROM daily_margin
      )
      SELECT 
        id,
        name,
        redemption_date::text,
        redemptions,
        ROUND(margin_pct::numeric, 2)::float as margin_pct,
        ROUND(prev_margin::numeric, 2)::float as prev_margin,
        ROUND(margin_drop::numeric, 2)::float as margin_drop,
        ROUND(avg_profit::numeric, 2)::float as avg_profit
      FROM margin_change
      WHERE margin_drop < -5
      ORDER BY redemption_date DESC, margin_drop ASC;
    `;

    return { alerts };
  }

  /**
   * Get category performance over time
   * Identifies which product types win in promos
   */
  async getCategoryPerformance(organizationId: string): Promise<CategoryPerformanceResponse> {
    const categories = await this.sql`
      SELECT 
        p.category,
        COUNT(DISTINCT c.id)::int as campaigns_run,
        COUNT(DISTINCT CASE WHEN c."actualProfit" > 0 THEN c.id END)::int as profitable_campaigns,
        ROUND(
          (COUNT(DISTINCT CASE WHEN c."actualProfit" > 0 THEN c.id END)::FLOAT / 
           NULLIF(COUNT(DISTINCT c.id), 0)) * 100, 
          2
        )::float as success_rate_pct,
        ROUND(AVG(pc."actualProfit")::numeric, 2)::float as avg_profit_per_redemption,
        SUM(pc."actualProfit")::float as total_category_profit
      FROM campaigns c
      JOIN "promoCodes" pc ON pc."campaignId" = c.id
      JOIN products p ON p.id = pc."productId"
      WHERE pc."isRedeemed" = true
        AND c."organizationId" = ${organizationId}
        AND c."createdAt" >= CURRENT_DATE - INTERVAL '180 days'
      GROUP BY p.category
      ORDER BY success_rate_pct DESC, total_category_profit DESC;
    `;

    return { categories };
  }

  /**
   * Get FIFO cost trends
   * Helps with purchase decisions
   */
  async getCostTrends(organizationId: string): Promise<CostTrendsResponse> {
    const products = await this.sql`
      WITH cost_trends AS (
        SELECT 
          p.id,
          p.name,
          p.category,
          p."currentFIFOCost" as current_cost,
          AVG(poi."unitCost") FILTER (
            WHERE po."orderDate" >= CURRENT_DATE - INTERVAL '90 days'
          ) as avg_cost_90d,
          AVG(poi."unitCost") FILTER (
            WHERE po."orderDate" >= CURRENT_DATE - INTERVAL '30 days'
          ) as avg_cost_30d,
          p."currentStockQuantity",
          p."leadTimeDays"
        FROM products p
        LEFT JOIN "purchaseOrderItems" poi ON poi."productId" = p.id
        LEFT JOIN "purchaseOrders" po ON po.id = poi."purchaseOrderId"
        WHERE p."organizationId" = ${organizationId}
          AND p."isActive" = true
        GROUP BY p.id
        
        
        .....
        
            
TL; DR:
The 7 Core Analytics (What Distributors Actually Need):

Campaign Profit Health - "Is this campaign losing money NOW?"
Slow-Moving Inventory - "What should I promote with good margins?"
Customer Capture ROI - "Are capture fees worth it?"
Margin Erosion Detection - "Did my profit flip negative mid-campaign?"
Category Performance - "Which product types win in promos?"
FIFO Cost Trends - "Are costs rising? When to buy?"
Compliance Audit - "Prove I'm compliant to regulators"


Real-time Analytics?
❌ Not truly "real-time" - DuckDB is OLAP (batch analytics), not OLTP
✅ Fast enough - Queries run in ~100-500ms on millions of rows
✅ "Near real-time" - Run checks every 5 mins, trigger alerts
⚡ For actual real-time (per-redemption alerts), use Postgres triggers + background jobs
