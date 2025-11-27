# Implementation Plan - AI Agent & Inventory Tool

## Goal Description
Implement the "Back-in-Stock" AI Agent using a "Sandwich Pattern" (Deterministic -> AI -> Deterministic) and a robust Inventory Tool as the Source of Truth. This ensures the AI acts on real data and never hallucinates stock or profit.

## User Review Required
> [!IMPORTANT]
> The `BackInStockAgent` will initially only create **Draft Orders**. It will NOT automatically commit orders. This is a safety feature.

## Proposed Changes

### Packages
#### [NEW] `packages/ai`
- **`src/tools/inventory.tool.ts`**: Wraps `fifoService` and `productService` to provide real-time stock and cost data.
- **`src/tools/profit-calculator.tool.ts`**: Wraps `ProfitCalculator` to validate promo profitability.
- **`src/agents/back-in-stock.agent.ts`**: The core logic.
    - Input: `productId`
    - Logic:
        1. Check Stock (Deterministic)
        2. If Stock > 0, ask AI for Promo Strategy (using Context)
        3. AI calls `profit-calculator` to verify strategy
        4. AI returns structured `DraftOrderProposal`
- **`src/core/context.ts`**: Simple context assembler (Product History + Business Rules).

### Apps
#### `apps/web`
- **`app/api/ai/events/back-in-stock/route.ts`**: New API route to trigger the agent.
- **`instrumentation.ts`**: Configure OpenLLMetry for tracing.

## Verification Plan

### Automated Tests
- **Unit Test for Inventory Tool**:
    - Mock `fifoService` and `productService`.
    - Verify `inventoryTool.execute` returns correct JSON.
    - Command: `bun test packages/ai/src/tools/inventory.tool.test.ts` (Will create this test)

### Manual Verification
1.  **Trigger the Agent**:
    - Use `curl` or Postman to hit `POST http://localhost:3000/api/ai/events/back-in-stock` with a valid `productId`.
2.  **Check Logs**:
    - Verify OpenLLMetry traces show the AI calling `inventory.tool` and `profit-calculator.tool`.
3.  **Check Database**:
    - Verify a new `DraftOrder` (or equivalent) is created in Saleor (mocked for now) or a log entry is made.
