# API Client Layer

**Type-safe, zero-URL frontend API client built on openapi-fetch + React Query**

This is the complete client-side API layer for Promco. Never write another URL string in your components.

## Quick Start

```tsx
import { useCampaigns, useCreateCampaign } from "@/lib/api-client";

function CampaignList() {
  // ✅ Fully typed query
  const { data, isLoading } = useCampaigns({ status: 'active' });
  
  // ✅ Fully typed mutation
  const { mutate } = useCreateCampaign();
  
  const handleCreate = () => {
    mutate({
      name: "Flash Sale",
      type: "flash_sale",
      // TypeScript knows exactly what fields are required/optional
    });
  };
  
  return (/* ... */);
}
```

## Architecture

```
Zod → OpenAPI → openapi.ts (types) → openapi-fetch → Domain Wrappers → React Query Hooks → Components
```

**Zero runtime overhead. All type-checking at compile time.**

## What's Inside

### 1. **Typed Client** (`client.ts`)
Central openapi-fetch instance with full type inference from generated OpenAPI types.

### 2. **Domain Wrappers** (`domains/`)
Clean, typed functions for each API domain:
- `campaigns` - Campaign operations
- `promoCodes` - Promo code management & redemption
- `purchaseOrders` - Stock arrival & PO management
- `inventory` - Movement tracking & FIFO batches
- `users` - User operations

### 3. **React Query Factories** (`factories/`)
Uniform factory functions to create typed hooks:
- `createQuery` - For GET operations
- `createMutation` - For POST/PATCH/DELETE operations

### 4. **Pre-built Hooks** (`hooks/`)
Ready-to-use React Query hooks for all core operations:

**Campaigns:**
- `useCampaigns()` - List campaigns
- `useCampaign(id)` - Get single campaign
- `useCampaignStats(id)` - Get campaign stats
- `useCreateCampaign()` - Create campaign
- `useUpdateCampaign()` - Update campaign
- `useCheckCampaignProfitability()` - Pre-flight profit check

**Promo Codes:**
- `usePromoCodes()` - List promo codes
- `usePromoCode(id)` - Get single code
- `useCreatePromoCode()` - Create code
- `useBulkCreatePromoCodes()` - Bulk create
- `useRedeemPromoCode()` - Redeem with FIFO profit calc
- `useValidatePromoCode()` - Validate without redeeming

**Purchase Orders:**
- `usePurchaseOrders()` - List POs
- `usePurchaseOrder(id)` - Get single PO
- `useCreatePurchaseOrder()` - Create PO
- `useUpdatePurchaseOrder()` - Update PO
- `useQuickStockArrival()` - Quick entry (onboarding)

**Inventory:**
- `useInventoryMovements()` - List movements
- `useFIFOBatches(productId)` - Get FIFO batches

## Usage Patterns

### Simple Query

```tsx
const { data, isLoading, error } = useCampaigns();

// data is fully typed as CampaignListResponse
// TypeScript knows all fields
```

### Query with Parameters

```tsx
const { data } = useCampaigns({
  status: 'active',
  type: 'flash_sale',
  page: 1,
  limit: 20,
});

// Parameters are type-checked against OpenAPI spec
```

### Mutations

```tsx
const { mutate, isPending } = useCreateCampaign();

mutate(
  { name: 'New Campaign', type: 'flash_sale' },
  {
    onSuccess: (data) => {
      console.log('Created:', data);
    },
    onError: (error) => {
      console.error('Failed:', error);
    },
  }
);
```

### Automatic Query Invalidation

Mutations automatically invalidate related queries:

```tsx
// When you redeem a promo code:
const { mutate } = useRedeemPromoCode();

// Automatically invalidates:
// - 'promo-codes'
// - 'campaigns' 
// - 'campaign-stats'
// - 'inventory'

// Your UI updates automatically
```

## Creating Custom Hooks

Use the factories for one-off or custom hooks:

```tsx
import { createQuery, createMutation } from "@/lib/api-client";
import { myDomain } from "@/lib/api-client/domains/my-domain";

// Custom query hook
export const useMyResource = createQuery("my-resource", myDomain.get);

// Custom mutation hook
export const useMyAction = createMutation(myDomain.action, {
  invalidateKeys: ["my-resource"],
});
```

## Type Safety Examples

### ✅ Correct Usage

```tsx
const { mutate } = useCreateCampaign();

mutate({
  name: "Flash Sale",
  type: "flash_sale",
  startDate: "2025-01-01",
  endDate: "2025-01-31",
});
// ✅ Compiles - all required fields present
```

### ❌ Type Errors

```tsx
mutate({
  name: "Flash Sale",
  // ❌ Error: 'type' is required
});

mutate({
  name: "Flash Sale",
  type: "invalid_type",
  // ❌ Error: type must be one of the valid campaign types
});
```

## Benefits

✅ **Zero URLs in components** - Never construct API paths manually  
✅ **Compile-time safety** - Wrong params = TypeScript error  
✅ **Automatic invalidation** - Mutations update related queries  
✅ **Consistent patterns** - All hooks work the same way  
✅ **IDE autocomplete** - Full IntelliSense for all operations  
✅ **Zero boilerplate** - No manual client code per endpoint  

## Workflow: Adding New Endpoint

1. **Backend**: Add Zod schema + `registerRoute()` in `@repo/schema`
2. **Generate**: Run `bun run build` in `packages/schema`
3. **Frontend**: Types auto-update, create hook if needed

Example:

```ts
// 1. In @repo/schema, already done ✅

// 2. Generate types (already done) ✅

// 3. Optionally create convenience hook:
export const useMyNewEndpoint = createQuery(
  "my-endpoint",
  api.GET("/api/v1/my-endpoint")
);
```

That's it. Full type safety, zero manual work.

## Advanced: Direct API Usage

If you need low-level access:

```tsx
import { api } from "@/lib/api-client";

// Direct openapi-fetch usage
const response = await api.GET("/api/v1/campaigns/{id}", {
  params: { path: { id: "123" } },
});

if (response.error) {
  // Handle error
} else {
  // response.data is typed
}
```

## Environment Setup

Set your API base URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Notes

- All hooks use React Query v5
- Default `staleTime` is 60 seconds
- Mutations invalidate queries by key
- Error handling via `error` property
- Loading states via `isLoading` / `isPending`

---

**This is production-grade, senior-level architecture without enterprise bloat.**
