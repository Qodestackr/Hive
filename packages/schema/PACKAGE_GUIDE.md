# @repo/schema

**The single source of truth for API contracts**

This package owns all Zod schemas, OpenAPI spec generation, and TypeScript type generation for the Promco API.

## What It Does

1. **Defines API contracts** using Zod schemas
2. **Generates OpenAPI spec** (`openapi.json`) from those schemas
3. **Generates TypeScript types** (`openapi.ts`) from the OpenAPI spec
4. **Exports both** for use by backend routes and frontend clients

## Architecture

```
Zod Schemas → zod-to-openapi → openapi.json → openapi-typescript → openapi.ts
      ↓                                                                    ↓
 Backend Routes                                                  Frontend Client
```

## Usage

### Building the Package

```bash
bun run build
```

This runs:
1. `generate:openapi` - Creates `generated/openapi.json`
2. `generate:types` - Creates `generated/openapi.ts`

### Adding a New Endpoint

1. **Create/update Zod schema** in `src/{domain}/{resource}.schema.ts`
2. **Register the route** in `src/endpoints/{domain}.ts`:

```ts
import { registerRoute } from "../utils/route-builder";
import { MyRequestSchema, MyResponseSchema } from "../domain/my.schema";

registerRoute({
  method: 'post',
  path: '/api/v1/my-resource',
  summary: 'Create my resource',
  description: 'Detailed description',
  tags: ['My Domain'],
  body: MyRequestSchema,
  response: MyResponseSchema,
  errors: {
    400: 'Invalid input',
    404: 'Not found',
  },
});
```

3. **Import the endpoint file** in `src/scripts/generate-openapi.ts`
4. **Run `bun run build`**

That's it. Types auto-update everywhere.

### Importing in Backend

```ts
import { CampaignCreateSchema } from "@repo/schema";

// Use for validation in API routes
const validated = CampaignCreateSchema.parse(body);
```

### Importing in Frontend

```ts
import type { paths } from "@repo/schema/generated/openapi";

// Used by openapi-fetch for type inference
const client = createClient<paths>({ baseUrl: "/api" });
```

## Package Structure

```
src/
  shared/          # Base schemas, money, timestamps, etc.
  auth/            # User schemas
  products/        # Product, inventory, purchase orders
  campaigns/       # Campaigns, promo codes
  customers/       # Customer schemas
  endpoints/       # Route registrations
  utils/           # Route builder helper
  scripts/         # Generation scripts
  openapi-registry.ts  # Central registry
  
generated/
  openapi.json     # Generated spec (tracked in git)
  openapi.ts       # Generated types (tracked in git)
```

## Benefits

✅ **Single source of truth** - Schemas define request/response contracts  
✅ **Type safety end-to-end** - Backend validates, frontend gets types  
✅ **Zero drift** - Schema changes = instant compile errors in both  
✅ **Self-documenting** - OpenAPI spec = automatic API docs  
✅ **Fast iteration** - Add schema → run build → use everywhere  

## Notes

- Generated files ARE tracked in git (easier to review changes)
- Never hand-edit `generated/*` files
- Always run `bun run build` after schema changes
- Use `registerRoute` helper for consistent patterns
