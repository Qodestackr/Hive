# Analytics Package

**Prescriptive intelligence for embedded analytics and AI consumption**

Current implementation: **Neon serverless → Postgres** (OLTP with light aggregation)
Upgrade path: **DuckDB ATTACH** (when you hit 10M+ rows)

---

## Architecture Decision

### Why Not Pure DuckDB Now?

Your analytics queries are **transactional OLTP with light aggregation**:
- JOINs across 3-4 tables max
- GROUP BY on `<1M` rows
- Window functions over bounded datasets
- Query time: **~50-200ms** (fast enough)

**Current scale**: Kenyan distributors running 10-50 campaigns/month, <100K redemptions total.

This is **perfect for Postgres**. Adding DuckDB now would be **premature optimization**.

### When to Upgrade to DuckDB

Switch to DuckDB ATTACH pattern when you hit:
- **>10M rows** in analytical queries
- **>500ms query times** on aggregations  
- Need for `PERCENTILE_CONT`, complex window functions over massive datasets
- Multi-table scans with **100M+ joined rows**

### The Upgrade Path (when needed)

```typescript
// Replace this
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL!);
const campaigns = await sql`SELECT ... FROM campaigns ...`;

// With this
import { Database } from 'duckdb-async';
const duckdb = await Database.create(':memory:');
await duckdb.exec(`
  INSTALL postgres; LOAD postgres;
  ATTACH '${process.env.DATABASE_URL}' AS neon (TYPE postgres);
`);
// Query Neon data via DuckDB's columnar engine (10-100x faster)
const campaigns = await duckdb.all(`
  SELECT * FROM neon.campaigns WHERE ...
`);
```

**Key insight**: You keep your Postgres schema as source of truth, but **query through DuckDB's columnar engine** for analytical workloads.

---

## Package Structure

```
packages/analytics/
├── src/
│   ├── calculators/
│   │   ├── analytics-calculator.ts          # Pure functions (velocity, discounts, LTV, ROI)
│   │   └── __tests__/
│   │       └── analytics-calculator.test.ts # 22 passing tests, no mocks
│   ├── services/
│   │   ├── analytics.service.ts             # Effect-based queries (Neon serverless)
│   │   └── index.ts
│   ├── types/
│   │   ├── analytics.types.ts               # TypeScript interfaces
│   │   └── index.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

---

## The 7 Analytics Queries

All queries follow the **same pattern**:
- Effect-based error handling
- OrganizationContext (no prop drilling)
- Deterministic (AI-friendly)
- Prescriptive intelligence, not engagement theater

### 1. Campaign Health
**Business Question**: "Is this campaign making or losing money RIGHT NOW?"

```typescript
analyticsService.getCampaignHealthEffect()
```

Returns campaigns with health status: 🚨 LOSING_MONEY | ⚠️ LOW_MARGIN | ✅ HEALTHY

### 2. Slow Movers
**Business Question**: "What should I promote to clear stock AND make money?"

```typescript
analyticsService.getSlowMoversEffect()
```

Returns products with recommendations: PROMOTE_NOW | MODERATE_PROMO | AVOID | MOVING_WELL

### 3. Capture ROI
**Business Question**: "Are capture fees worth it?"

```typescript
analyticsService.getCaptureROIEffect()
```

Proves outcome-based pricing with capture fee ROI (e.g., 24x = KES 240 profit per KES 10 fee)

### 4. Margin Erosion
**Business Question**: "Did my campaign profit flip negative mid-campaign?"

```typescript
analyticsService.getMarginErosionEffect()
```

Alerts when margin drops >5 percentage points day-over-day

### 5. Category Performance
**Business Question**: "Which product types consistently win in promos?"

```typescript
analyticsService.getCategoryPerformanceEffect()
```

Success rate % and profit by category over 180 days

### 6. Cost Trends
**Business Question**: "Are my costs going up? When should I buy more?"

```typescript
analyticsService.getCostTrendsEffect()
```

Recommendations: BUY_NOW | LOW_STOCK | PRICE_SPIKE | STABLE

### 7. Compliance Summary
**Business Question**: "Can I prove to KRA/regulators that I'm compliant?"

```typescript
analyticsService.getComplianceSummaryEffect()
```

Monthly event summaries for audit trails