# AI Integration Tasks

- [ ] **Phase 1: Foundation & Architecture (Fin-Inspired)**
    - [x] Scaffold `packages/ai`
    - [x] Install Vercel AI SDK & OpenLLMetry
    - [ ] **[CRITICAL]** Refine `AI_INTEGRATION_PLAN.md` with "Learning Loop" architecture (Context, Evals, KB) <!-- id: 0 -->
    - [ ] Create `packages/ai/src/core/context.ts` (Context Engineering primitive) <!-- id: 1 -->

- [ ] **Phase 2: The Tool Layer (Sources of Truth)**
    - [x] `profit-calculator.tool.ts` (The Safety Check)
    - [ ] `inventory.tool.ts` (The Source of Truth - Wraps Saleor/FIFO) <!-- id: 2 -->
    - [ ] `promo-history.tool.ts` (The Memory - What worked before?) <!-- id: 3 -->

- [ ] **Phase 3: The Agent Layer (Back-in-Stock Pilot)**
    - [ ] Implement `BackInStockAgent` using the "Sandwich Pattern" <!-- id: 4 -->
    - [ ] Add "Simulated Evals" script to test agent against historical data <!-- id: 5 -->

- [ ] **Phase 4: Knowledge Base & Feedback**
    - [ ] Design schema for `ai_knowledge_base` (Failures, User Rules) <!-- id: 6 -->
    - [ ] Implement "Feedback Loop" (User accepts/rejects -> updates KB) <!-- id: 7 -->
