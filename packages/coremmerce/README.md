# @repo/coremmerce

**Saleor Integration Layer for Promco**

Clean, type-safe, pure functions for interacting with Saleor. No business logic here - that lives in `@repo/services`.

---

## Philosophy

> **"The frontend calls our API. Our API calls services. Services call coremmerce + DB. Coremmerce calls Saleor."**

This package is the **ONLY** place that talks to Saleor directly. It provides pure, testable functions that:
- Accept `SaleorContext` (DI pattern)
- Return typed data
- Throw `PromcoError` on failure (never return `{ success: false }`)

---

## Installation

```bash
pnpm add @repo/coremmerce
```

---

## Usage

### 1. Get Saleor Context

```typescript
import { getSaleorContext } from '@repo/services'; // Future: context provider
import type { SaleorContext } from '@repo/coremmerce';

const context: SaleorContext = await getSaleorContext(organizationId);
// Context contains: channelId, channelSlug, warehouseId, organizationId
```

### 2. Use Pure Functions

```typescript
import {
  getProductById,
  createProduct,
  updateStock,
  createPromotionWithRules,
} from '@repo/coremmerce';

// Inventory operations
const product = await getProductById('product-id', context);

const newProduct = await createProduct(
  {
    name: 'Johnnie Walker Black',
    slug: 'johnnie-walker-black',
    productTypeId: 'spirits-type-id',
    description: 'Premium scotch whisky',
  },
  context
);

await updateStock('variant-id', 100, context);

// Promotion operations
const { promotion, rules } = await createPromotionWithRules(
  {
    name: 'Holiday Sale',
    startDate: new Date('2024-12-01'),
    endDate: new Date('2024-12-31'),
    promcoCampaignId: 'campaign-123',
    rules: [
      {
        name: '20% off spirits',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        productIds: ['product-1', 'product-2'],
      },
    ],
  },
  context
);
```

### 3. Handle Errors

```typescript
import {
  SaleorProductNotFound,
  SaleorStockUpdateFailed,
  SaleorRateLimitExceeded,
} from '@repo/coremmerce';
import { createError } from '@repo/utils';

try {
  const product = await getProductById(productId, context);
} catch (error) {
  if (error instanceof SaleorProductNotFound) {
    // Product doesn't exist in Saleor
    console.warn('Product not found:', error.saleorProductId);
  } else if (error instanceof SaleorStockUpdateFailed) {
    // Stock update failed
    console.error('Stock update failed:', error.reason);
  } else if (error instanceof SaleorRateLimitExceeded) {
    // Rate limited - retry after X seconds
    console.warn('Rate limited, retry after:', error.retryAfter);
  }
  // All errors are PromcoError with full context
  throw error; // Re-throw or handle
}
```

---

## API Reference

### Types

- **`SaleorContext`** - Encapsulates channelId, warehouseId, organizationId
- **`SaleorError`** - Saleor GraphQL error shape
- **`SaleorGraphQLError`** - GraphQL error response

### Domain Errors

All functions throw specific domain errors:

- `SaleorProductNotFound` - Product/variant doesn't exist
- `SaleorVariantNotFound` - Variant not found by SKU or ID
- `SaleorStockUpdateFailed` - Stock update operation failed
- `SaleorProductCreationFailed` - Product/variant creation failed
- `SaleorPromotionError` - Promotion operation failed
- `SaleorInvalidChannelConfig` - Missing channel/warehouse configuration
- `SaleorRateLimitExceeded` - API rate limit hit

### Inventory Functions

#### Product Operations
- `getProductById(productId, context)` - Fetch product by Saleor ID
- `getProductBySlug(slug, context)` - Fetch product by slug
- `listProducts(params, context)` - List products with filters/pagination
- `getProductInventory(productId, context)` - Get variant stock levels
- `createProduct(input, context)` - Create new product
- `createProductVariant(input, context)` - Create variant with optional stock
- `publishProductToChannel(productId, context)` - Make product visible

#### Variant Operations
- `setVariantPrice(variantId, price, context)` - Set variant price
- `updateVariantCostPrice(variantId, cost, context)` - Update cost price (for FIFO sync)
- `getVariantBySKU(sku, context)` - Find variant by SKU

#### Stock Operations
- `updateStock(variantId, quantity, context)` - Update stock quantity

### Promotion Functions

#### Core Operations
- `createPromotion(input, context)` - Create promotion shell
- `createPromotionRule(promotionId, rule, context)` - Add discount rule
- `getPromotion(promotionId, context)` - Fetch promotion details
- `listActivePromotions(context, params)` - List currently active promotions

#### Management
- `updatePromotion(promotionId, updates, context)` - Update promotion details
- `updatePromotionRule(ruleId, updates, context)` - Update discount rule
- `updatePromotionMetadata(promotionId, metadata, context)` - Link to Promco campaigns
- `deletePromotion(promotionId, context)` - Delete promotion
- `deletePromotionRule(ruleId, context)` - Delete specific rule

#### Helpers
- `createPromotionWithRules(input, context)` - Create promotion + rules in one go

---

## Error Handling Philosophy

### ❌ Old Pattern (DON'T DO THIS)

```typescript
try {
  const result = await someSaleorOperation();
  if (result.errors) {
    console.error('Error:', result.errors);
    return { success: false, error: 'Failed' };
  }
  return { success: true, data: result };
} catch (error) {
  console.error('Failed:', error);
  return { success: false };
}
```

**Problems:**
- Loses error context
- No type safety
- Can't distinguish error types
- Hard to test

### ✅ New Pattern (DO THIS)

```typescript
// Function throws on error
export async function createProduct(input, context) {
  const data = await executeSaleorRequest(
    CreateProductDocument,
    { input },
    context
  );
  
  if (data.productCreate?.errors?.length) {
    throw new SaleorProductCreationFailed({
      productName: input.name,
      reason: 'Validation errors',
      saleorErrors: data.productCreate.errors,
    });
  }
  
  return data.productCreate.product;
}

// Caller can handle specific errors
try {
  const product = await createProduct(input, context);
} catch (error) {
  if (error instanceof SaleorProductCreationFailed) {
    // Handle creation failure
  }
  // All errors have full context
}
```

**Benefits:**
- Type-safe error handling
- Full context preservation (organizationId, traceId, etc.)
- Can catch specific error types
- Easy to test

---

## Architecture

```
packages/coremmerce/
├── src/
│   ├── types.ts                    # Core types (SaleorContext, etc.)
│   ├── index.ts                    # Barrel exports
│   ├── errors/
│   │   └── saleor-errors.ts       # Domain errors
│   ├── client/
│   │   └── saleor-client.ts       # GraphQL client + error normalization
│   ├── functions/
│   │   ├── inventory.ts            # Pure inventory functions
│   │   └── promotions.ts           # Pure promotion functions
│   └── graphql/
│       ├── queries/                # GraphQL queries
│       ├── mutations/              # GraphQL mutations
│       └── fragments/              # Reusable fragments
```

---

## Development

### Run GraphQL Codegen

```bash
cd packages/coremmerce
pnpm codegen
```

This generates TypeScript types from your GraphQL queries/mutations.

### Testing

```bash
pnpm test
```

---

## Best Practices

### 1. Always Use SaleorContext

```typescript
// ✅ Good - context injected
await createProduct(input, context);

// ❌ Bad - prop-drilling organizationId
await createProduct(input, organizationId);
```

### 2. Let Errors Bubble

```typescript
// ✅ Good - throw and let caller handle
export async function updateStock(variantId, quantity, context) {
  const data = await executeSaleorRequest(...);
  if (data.errors) {
    throw new SaleorStockUpdateFailed({ ... });
  }
  return data.result;
}

// ❌ Bad - swallowing errors
export async function updateStock(...) {
  try {
    const data = await executeSaleorRequest(...);
    return { success: true, data };
  } catch {
    return { success: false };
  }
}
```

### 3. Single Responsibility

```typescript
// ✅ Good - one function, one job
await createProduct(input, context);
await createProductVariant(variantInput, context);
await setVariantPrice(variantId, price, context);

// ❌ Bad - giant function doing everything
await createCompleteProductWithVariantsAndPricing(...);
```

### 4. Type Safety

```typescript
// ✅ Good - explicit types
const product: ProductDetails = await getProductById(id, context);

// ❌ Bad - any
const product: any = await getProductById(id, context);
```

---

## Migration from Old Code

If you're migrating from `packages/old-coremmerce`, here's the mapping:

| Old Code | New Code |
|----------|----------|
| `createCompleteProduct()` | `createProduct()` + `createProductVariant()` + `setVariantPrice()` |
| `CommercePromotions.createBulkPricingPromotion()` | `createPromotionWithRules()` |
| `createPurchaseOrder()` | Use `@repo/services` (checkout is business logic) |
| Raw `fetch()` calls | `executeSaleorRequest()` |
| Class-based services | Pure functions |
| `{ success: false }` returns | Throw `PromcoError` |

---

## Contributing

1. Keep functions pure (no side effects except Saleor API calls)
2. Always throw `PromcoError` on failure
3. Document with JSDoc comments
4. Add tests for new functions
5. Run codegen after changing GraphQL files

---

## License

MIT
