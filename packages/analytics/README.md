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

---

## Usage Example

```typescript
import { Effect } from 'effect';
import { analyticsService } from '@repo/analytics/services';
import { OrganizationContext } from '@repo/utils';

// Service layer automatically provides OrganizationContext
const healthEffect = analyticsService.getCampaignHealthEffect();

// In API route (auto-provided by createWorkspaceRouteEffect)
export const GET = createWorkspaceRouteEffect({
  outputSchema: CampaignHealthResponseSchema,
  handler: () => analyticsService.getCampaignHealthEffect(),
  options: {
    operationName: 'getCampaignHealth',
    requiredPermissions: ['analytics.view'],
  },
});
```

---

## Pure Calculators (AI-Friendly)

All calculation logic is **pure functions** with zero DB dependencies:

```typescript
import { AnalyticsCalculator } from '@repo/analytics/calculators';

// Velocity scoring
const score = AnalyticsCalculator.calculateVelocityScore(
  unitsSold30d: 5,
  currentStock: 100
); // Returns 5 (slow mover)

// Safe discount calculation
const discount = AnalyticsCalculator.calculateSafeDiscount({
  marginPct: 40,
  velocityScore: 80, // Fast mover
  targetMarginPct: 10
}); // Returns ~27% (aggressive discount for fast movers)

// Customer LTV
const ltv = AnalyticsCalculator.calculateCustomerLTV(redemptions);

// Capture fee ROI
const roi = AnalyticsCalculator.calculateCaptureFeeROI(
  totalProfit: 2400,
  customerCount: 10,
  captureFeePerCustomer: 10
); // Returns 24 (24x ROI)
```

**Why pure functions matter**:
- **Testable**: 22 tests, 0 mocks, 100% deterministic
- **AI-friendly**: No hallucinations, reliable tool calls
- **Reusable**: Works in backend, frontend, AI agents

---

## Testing

```bash
cd packages/analytics
bun test
```

All tests pass:
```
✓ AnalyticsCalculator › calculateVelocityScore › returns 0 for zero stock
✓ AnalyticsCalculator › calculateSafeDiscount › suggests higher discount for fast movers
✓ AnalyticsCalculator › calculateCustomerLTV › calculates LTV correctly
✓ AnalyticsCalculator › calculateCaptureFeeROI › calculates ROI correctly
... (22 tests total)
```

---

## Adding a New Analytics Query

**Pattern established**. Adding the 8th analytics is ~30 minutes:

1. **Add TypeScript interface** (`src/types/analytics.types.ts`)
2. **Add Zod schema** (`packages/schema/src/analytics/analytics.schema.ts`)
3. **Add query method** to `analyticsService` (follow existing pattern)
4. **Register OpenAPI endpoint** (`packages/schema/src/endpoints/analytics.ts`)
5. **Create API route** (13 lines, copy-paste from existing)

Done. Tests optional but recommended.

---

## Philosophy

**"Do ONE thing well such that adding other things is VERY EASY"**

Campaign Health was the wedge. All 7 analytics follow the **exact same pattern**:
- Effect-based error handling  
- OrganizationContext (no prop drilling)
- Pure calculators for business logic
- Deterministic queries (AI-friendly)

**This is for embedded analytics**, not dashboards. AI tools and API consumers need **deterministic, prescriptive intelligence**. Not engagement theater.

---

## License

Promco Analytics - Built for Kenyan liquor distributors who need profit intelligence, not pretty charts.
