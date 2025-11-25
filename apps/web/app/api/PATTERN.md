# API Development Pattern

> **Purpose**: This document defines our API architecture pattern to ensure consistency, type safety, and maintainability across all routes. When using AI tools for code generation, reference this document to maintain our standards.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Principles](#core-principles)
3. [Route Creation Patterns](#route-creation-patterns)
4. [Service Layer](#service-layer)
5. [Schema & Validation](#schema--validation)
6. [Error Handling](#error-handling)
7. [Infrastructure Wrappers](#infrastructure-wrappers)
8. [Examples](#examples)

---

## Architecture Overview

Our API follows a **layered architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────┐
│  Route Handler (Thin Wrapper)          │
│  - Input validation (Zod)              │
│  - Output validation (Zod)             │
│  - Delegates to service layer          │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Wrapper Layer (Auto-Applied)           │
│  - Authentication (withEnhancedApiContext)│
│  - Authorization (permissions)          │
│  - OTEL tracing                         │
│  - Error handling                       │
│  - Caching (optional)                   │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Service Layer (Business Logic)         │
│  - Transaction management               │
│  - Business rules                       │
│  - Orchestration                        │
│  - Calls database operations            │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Database Layer (withDbOperation)       │
│  - OTEL instrumentation                 │
│  - Connection management                │
│  - Drizzle abstraction          │
└─────────────────────────────────────────┘
```

---

## Core Principles

### 1. **Routes Are Thin Wrappers**
Routes should do THREE things only:
- Parse and validate input (Zod schemas)
- Call a service method
- Validate and return output (Zod schemas)

**Never put business logic in routes.**

### 2. **Services Contain All Business Logic**
Services handle:
- Business rules and validation
- Transaction management
- Multiple database operations
- External API calls
- Complex orchestration

### 3. **Type Safety End-to-End**
- Input validated by Zod at runtime
- Output validated by Zod at runtime
- TypeScript types inferred from schemas
- Compile-time errors prevent runtime surprises

### 4. **Observability by Default**
- Every route is traced with OpenTelemetry
- Every database operation is instrumented
- Every error is captured with context
- No manual logging needed

### 5. **Security as Infrastructure**
- Authentication enforced at wrapper level
- Permission checks automatic
- Workspace/organization context injected
- No manual security code in routes

---

## Route Creation Patterns

We provide two route factories based on authentication requirements:

### `createWorkspaceRoute` (B2B, Authenticated)

Use for routes that require:
- Organization/workspace context
- Permission checks
- Authenticated users

```typescript
export const POST = createWorkspaceRoute({
    inputSchema: InputSchema,      // Optional: validates request body
    outputSchema: OutputSchema,    // Required: validates response
    
    handler: async (data, context) => {
        // context includes: workspace, session, permissions, req, params
        return await yourService.doSomething(data, context.workspace.id);
    },

    options: {
        operationName: "descriptiveName",           // For OTEL traces
        requiredPermissions: ["resource.action"],   // Auto-checked
        cacheResponse: false,                       // Optional caching
        errorContext: { 
            feature: "featureName", 
            action: "actionName" 
        },
    },
});
```

### `createPublicRoute` (Public, Optional Auth)

Use for routes that:
- Don't require workspace context
- Are public (webhooks, auth endpoints)
- Have optional authentication

```typescript
export const POST = createPublicRoute({
    inputSchema: InputSchema,
    outputSchema: OutputSchema,
    
    handler: async (data, context) => {
        // context includes: req, session (may be null)
        return await yourService.doSomething(data);
    },

    options: {
        operationName: "webhookHandler",
        errorContext: { feature: "webhooks", action: "process" },
    },
});
```

---

## Service Layer

### Structure

```typescript
// apps/web/services/subscription.ts
import db from "@workspace/db";
import { withDbOperation } from "@workspace/db";

export const subscriptionService = {
    async changeSubscription(
        subscriptionId: string,
        planId: string,
        paymentMethodId: string,
        organizationId: string
    ) {
        // 1. Fetch existing data
        const subscription = await withDbOperation({
            operation: "findUnique",
            table: "subscription",
            context: { organizationId, subscriptionId }
        }, () => db.subscription.findUnique({
            where: { id: subscriptionId }
        }));

        if (!subscription) {
            throw createError.notFound("Subscription", { subscriptionId });
        }

        // 2. Business logic
        const plan = await withDbOperation({
            operation: "findUnique",
            table: "plan",
            context: { planId }
        }, () => db.plan.findUnique({
            where: { id: planId }
        }));

        // 3. Transaction (if multiple operations)
        return await withDbOperation({
            operation: "update",
            table: "subscription",
            context: { organizationId, subscriptionId }
        }, () => db.subscription.update({
            where: { id: subscriptionId },
            data: {
                planId,
                paymentMethodId,
                updatedAt: new Date(),
            },
        }));
    },
};
```

### Service Best Practices

- **Use `withDbOperation`** for every database call (OTEL + error context)
- **Throw typed errors** using `createError.*` utilities
- **Handle transactions** at service level, not route level
- **Return plain objects** (not NextResponse) - route handles response formatting

---

## Schema & Validation

### Schema Location

Schemas live in the shared `@repo/schema` package:

```
packages/schema/src/
├── auth/
│   └── user.schema.ts
├── billing/
│   ├── subscription.schema.ts
│   └── plan.schema.ts
├── shared/
│   ├── base.schema.ts       # Common types (ID, Timestamps)
│   └── money.schema.ts      # Currency handling
└── index.ts                 # Exports
```

### Schema Definition

```typescript
// packages/schema/src/billing/subscription.schema.ts
import { z } from "zod";
import { ID, Timestamps } from "../shared/base.schema";

export const SubscriptionChangeSchema = z.object({
    subscriptionId: ID,
    planId: ID,
    paymentMethodId: z.string().optional(),
}).openapi('SubscriptionChange');

export const SubscriptionResponseSchema = z.object({
    id: ID,
    planId: ID,
    status: z.enum(['ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING']),
    currentPeriodEnd: z.string().datetime(),
}).merge(Timestamps).openapi('SubscriptionResponse');

export type SubscriptionChangeInput = z.infer<typeof SubscriptionChangeSchema>;
export type SubscriptionResponse = z.infer<typeof SubscriptionResponseSchema>;
```

### OpenAPI Registration

Schemas are registered separately for documentation:

```typescript
// packages/schema/src/endpoints/subscription.ts
import { registerRoute } from "../utils/route-builder";
import { SubscriptionChangeSchema, SubscriptionResponseSchema } from "../billing/subscription.schema";

registerRoute({
    method: 'post',
    path: '/api/v1/subscriptions/change',
    summary: 'Change subscription plan',
    tags: ['Subscriptions'],
    body: SubscriptionChangeSchema,
    response: SubscriptionResponseSchema,
});
```

---

## Error Handling

### Error Types

We use typed errors from `@workspace/utils`:

```typescript
import { createError } from "@workspace/utils";

// Not found (404)
throw createError.notFound("Resource", { id: "123" });

// Validation error (400)
throw createError.validation("Invalid email format", "email", { value: "bad" });

// Unauthorized (401)
throw createError.unauthorized("Login required", { userId: "123" });

// Forbidden (403)
throw createError.forbidden("Insufficient permissions", { 
    required: ["admin"], 
    actual: ["user"] 
});

// Business rule violation (422)
throw createError.businessRule("subscription_expired", {
    subscriptionId: "sub_123",
    message: "Cannot perform action on expired subscription"
});
```

### Error Flow

```
Service throws typed error
         ↓
Wrapper catches (withEnhancedApiContext)
         ↓
handleApiError formats response
         ↓
OTEL records error with context
         ↓
Client receives consistent error format
```

**Never catch errors in routes unless you have a specific reason.**

---

## Infrastructure Wrappers

### `withEnhancedApiContext`

**Location**: `apps/web/lib/with-enhanced-context.ts`

**What it does**:
- Authenticates user session
- Resolves workspace/organization context
- Checks permissions
- Wraps handler with OTEL tracing
- Catches and formats errors
- Handles response caching (if enabled)

**You never call this directly** - use `createWorkspaceRoute` or `createPublicRoute`.

### `withDbOperation`

**Location**: `packages/db/with-db-operation.ts`

**What it does**:
- Wraps Prisma/Drizzle calls with OTEL spans
- Adds operation metadata (table, operation type)
- Records query context for debugging
- Handles connection management

**Always use this for database operations**:

```typescript
// ✅ CORRECT
const user = await withDbOperation({
    operation: "findUnique",
    table: "user",
    context: { userId }
}, () => db.user.findUnique({ where: { id: userId } }));

// ❌ WRONG - No OTEL, no context
const user = await db.user.findUnique({ where: { id: userId } });
```

### `withCacheOperation`

**Location**: `packages/cache/with-cache-operation.ts`

**What it does**:
- Wraps Redis calls with OTEL spans
- Records cache hits/misses
- Adds cache key context

**Usage**:

```typescript
const cached = await withCacheOperation({
    operation: "get",
    key: cacheKey,
    context: { organizationId }
}, () => redis.get(cacheKey));
```

---

## Examples

### Example 1: Simple CRUD Route

```typescript
// apps/web/app/api/v1/billing/contact/route.ts
import { createWorkspaceRoute } from "@/lib/create-api-route";
import { BillingContactCreateSchema, BillingContactResponseSchema } from "@repo/schema";
import { billingContactService } from "@/services/billing-contact";

export const POST = createWorkspaceRoute({
    inputSchema: BillingContactCreateSchema,
    outputSchema: BillingContactResponseSchema,
    
    handler: async (data, { workspace }) => {
        return await billingContactService.upsert(data, workspace.id);
    },

    options: {
        operationName: "createBillingContact",
        requiredPermissions: ["billing.contact.write"],
        errorContext: { feature: "billing", action: "create-contact" },
    },
});

export const GET = createWorkspaceRoute({
    outputSchema: BillingContactResponseSchema,
    
    handler: async (_, { workspace }) => {
        return await billingContactService.get(workspace.id);
    },

    options: {
        operationName: "getBillingContact",
        requiredPermissions: ["billing.contact.view"],
        cacheResponse: true,
        cacheTTL: 300, // 5 minutes
        errorContext: { feature: "billing", action: "get-contact" },
    },
});
```

### Example 2: Public Webhook

```typescript
// apps/web/app/api/v1/webhooks/mpesa/route.ts
import { createPublicRoute } from "@/lib/create-api-route";
import { MpesaCallbackSchema, WebhookResponseSchema } from "@repo/schema";
import { mpesaService } from "@/services/mpesa";

export const POST = createPublicRoute({
    inputSchema: MpesaCallbackSchema,
    outputSchema: WebhookResponseSchema,
    
    handler: async (data) => {
        await mpesaService.processCallback(data);
        
        return {
            ResultCode: 0,
            ResultDesc: "Success",
        };
    },

    options: {
        operationName: "mpesaWebhook",
        errorContext: { feature: "payments", action: "mpesa-callback" },
    },
});
```

### Example 3: Complex Service

```typescript
// apps/web/services/subscription.ts
import db from "@workspace/db";
import { withDbOperation } from "@workspace/db";
import { createError } from "@workspace/utils";

export const subscriptionService = {
    async changeSubscription(
        subscriptionId: string,
        planId: string,
        paymentMethodId: string,
        organizationId: string
    ) {
        // 1. Validate subscription exists and belongs to org
        const subscription = await withDbOperation({
            operation: "findUnique",
            table: "subscription",
            context: { organizationId, subscriptionId }
        }, () => db.subscription.findUnique({
            where: { 
                id: subscriptionId,
                organizationId 
            },
            include: { plan: true }
        }));

        if (!subscription) {
            throw createError.notFound("Subscription", { subscriptionId });
        }

        if (subscription.status === 'CANCELED') {
            throw createError.businessRule("subscription_canceled", {
                message: "Cannot change plan on canceled subscription"
            });
        }

        // 2. Validate new plan
        const newPlan = await withDbOperation({
            operation: "findUnique",
            table: "plan",
            context: { planId }
        }, () => db.plan.findUnique({
            where: { id: planId }
        }));

        if (!newPlan) {
            throw createError.notFound("Plan", { planId });
        }

        // 3. Calculate proration (business logic)
        const prorationAmount = calculateProration(
            subscription.plan.price,
            newPlan.price,
            subscription.currentPeriodEnd
        );

        // 4. Update subscription in transaction
        return await withDbOperation({
            operation: "update",
            table: "subscription",
            context: { organizationId, subscriptionId }
        }, () => db.subscription.update({
            where: { id: subscriptionId },
            data: {
                planId,
                paymentMethodId,
                updatedAt: new Date(),
            },
        }));
    },
};

function calculateProration(oldPrice: number, newPrice: number, periodEnd: Date) {
    // Business logic here
    return 0;
}
```

---

## Common Patterns

### Pattern: Fetching Related Data

```typescript
handler: async (data, { workspace, context }) => {
    // context.warehouseId is automatically available if route has :warehouseId param
    return await inventoryService.getStock(
        workspace.id, 
        context.warehouseId!
    );
}
```

### Pattern: File Uploads (GET params from searchParams)

```typescript
handler: async (data, { searchParams }) => {
    const format = searchParams.format || 'json';
    return await reportService.generate(format);
}
```

### Pattern: Pagination

```typescript
handler: async (data, { searchParams }) => {
    const page = parseInt(searchParams.page || '1');
    const limit = parseInt(searchParams.limit || '20');
    return await listService.paginate(page, limit);
}
```

---

## Checklist for New Routes

When creating a new API route, ensure:

- [ ] Schema defined in `@repo/schema`
- [ ] Schema registered in `packages/schema/src/endpoints/`
- [ ] Route uses `createWorkspaceRoute` or `createPublicRoute`
- [ ] Handler delegates to service (no business logic in route)
- [ ] Service uses `withDbOperation` for all database calls
- [ ] Errors thrown using `createError.*` utilities
- [ ] Required permissions specified in options
- [ ] OTEL `operationName` is descriptive
- [ ] Error context includes feature + action

---

## Anti-Patterns (Don't Do This)

### ❌ Business Logic in Routes

```typescript
// WRONG
handler: async (data, { workspace }) => {
    const user = await db.user.findUnique({ where: { id: data.userId } });
    if (!user) throw new Error("Not found");
    if (user.balance < data.amount) throw new Error("Insufficient funds");
    // ... more logic
}
```

### ❌ Direct Database Calls

```typescript
// WRONG
const user = await db.user.findUnique({ where: { id } });

// CORRECT
const user = await withDbOperation({
    operation: "findUnique",
    table: "user",
    context: { userId: id }
}, () => db.user.findUnique({ where: { id } }));
```

### ❌ Manual Response Formatting

```typescript
// WRONG
handler: async (data) => {
    const result = await service.doSomething(data);
    return NextResponse.json({ success: true, data: result });
}

// CORRECT - wrapper handles response formatting
handler: async (data) => {
    return await service.doSomething(data);
}
```

### ❌ Try-Catch in Routes

```typescript
// WRONG - wrapper handles errors
handler: async (data) => {
    try {
        return await service.doSomething(data);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// CORRECT - let wrapper handle errors
handler: async (data) => {
    return await service.doSomething(data);
}
```

---

## Migration Guide

### Migrating Old Routes

**Before**:
```typescript
export const POST = withEnhancedApiContext(async ({ req, workspace }) => {
    const body = await req.json();
    const validated = schema.parse(body);
    const result = await db.table.create({ data: validated });
    return NextResponse.json({ data: result });
}, { operationName: "createThing", requiredPermissions: ["thing.create"] });
```

**After**:
```typescript
export const POST = createWorkspaceRoute({
    inputSchema: ThingCreateSchema,
    outputSchema: ThingResponseSchema,
    handler: async (data, { workspace }) => {
        return await thingService.create(data, workspace.id);
    },
    options: {
        operationName: "createThing",
        requiredPermissions: ["thing.create"],
        errorContext: { feature: "things", action: "create" },
    },
});
```

**Benefits**:
- 60% less code
- Type-safe end-to-end
- Business logic moved to service
- Consistent error handling
- Auto-validated input/output

---

## FAQ

### Q: When should I use `createWorkspaceRoute` vs `createPublicRoute`?

**Use `createWorkspaceRoute`** when:
- Route requires authentication
- Route operates on organization/workspace data
- Route needs permission checks

**Use `createPublicRoute`** when:
- Webhooks from external services
- Public auth endpoints (login, register)
- Public API endpoints (no auth required)

### Q: Can I skip input validation?

Yes, if the route has no request body (GET requests):

```typescript
export const GET = createWorkspaceRoute({
    // No inputSchema - data will be {}
    outputSchema: ResponseSchema,
    handler: async (_, { workspace }) => {
        return await service.getAll(workspace.id);
    },
    options: { ... },
});
```

### Q: How do I handle query parameters?

Access via `searchParams`:

```typescript
handler: async (_, { searchParams }) => {
    const filter = searchParams.filter;
    return await service.getFiltered(filter);
}
```

### Q: How do I handle route parameters (e.g., `/users/:id`)?

Access via `params`:

```typescript
handler: async (_, { params }) => {
    const userId = params.id;
    return await userService.getById(userId);
}
```

### Q: Can I return errors from handlers?

**No.** Throw typed errors using `createError.*` utilities. The wrapper will format them properly.

### Q: How do I test routes?

Test the service layer, not the route. Routes are thin wrappers with minimal logic.

```typescript
// Test this
describe('subscriptionService', () => {
    it('should change subscription plan', async () => {
        const result = await subscriptionService.changeSubscription(...);
        expect(result.planId).toBe(newPlanId);
    });
});

// Don't test this (infrastructure)
// The wrapper + validation is tested once, not per route
```

---

## Summary

**Our API pattern prioritizes**:
1. **Type safety** - Schemas enforce contracts
2. **Separation of concerns** - Routes delegate to services
3. **Observability** - OTEL traces everything automatically
4. **Security** - Authentication/authorization enforced by infrastructure
5. **Consistency** - All routes follow the same pattern

**When in doubt**:
- Keep routes thin (3 lines max in handler)
- Put logic in services
- Validate with Zod
- Use typed errors
- Let wrappers handle infrastructure
