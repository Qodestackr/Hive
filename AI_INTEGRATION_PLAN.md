# AI Integration Plan: The "Fin-Inspired" Architecture

> **Philosophy**: "Evolutionary Architecture for Deterministic Intelligence."

This document outlines the architectural plan to integrate AI into Promco, inspired by Intercom's Fin AI. The goal is not just to "add AI", but to build a **Learning System** where deterministic truth (Inventory, Profit) guides the probabilistic AI (LLM), and every interaction feeds a growing knowledge base.

## 1. The Core Philosophy: "Truth, Safety, then Magic"

We treat AI as a reasoning engine, not a knowledge store. It must always query "Source of Truth" tools before speaking.

| Layer | Responsibility | Technology |
|-------|----------------|------------|
| **1. The Truth Layer** | Hard facts: Inventory, Costs, Past Performance. | **Effect Services + MCP Tools** |
| **2. The Context Engine** | Relevant context injection (RAG + Rules). | **@repo/ai/core/context** |
| **3. The Reasoning Layer** | The "Brain" that decides what to do. | **Vercel AI SDK (Claude Haiku 4.5)** |
| **4. The Safety Layer** | Deterministic checks (Profit Calc, Compliance). | **Zod Schemas + Effect Policies** |
| **5. The Learning Layer** | Evals, Feedback Loops, Knowledge Base. | **OpenLLMetry + `ai_knowledge_base`** |

---

## 2. Architecture: The "Learning Loop"

Instead of a simple linear flow, we build a loop where every failure and success improves the system.

```mermaid
graph TD
    User[Trigger: Back-in-Stock / User Query] --> Context{Context Engine}
    Context -->|Injects: Rules, Inventory, History| Agent[AI Agent]
    Agent -->|Tool Call| Tools[Inventory Tool / Profit Tool]
    Tools -->|Fact| Agent
    Agent -->|Proposal| Safety[Safety Layer (Profit Check)]
    Safety -->|Pass| Action[Draft Order / Response]
    Safety -->|Fail| Feedback[Feedback Loop]
    Feedback -->|Update| KB[Knowledge Base]
    Action -->|User Review| HITL[Human in the Loop]
    HITL -->|Approve/Reject| KB
```

### Key Components

#### A. The Context Engine (`packages/ai/src/core/context.ts`)
This is the "Prompt Engineer" in code. It assembles the prompt dynamically based on:
1.  **User Context**: Who is this? (Distributor, Retailer?)
2.  **Business Rules**: "Never discount Hennessy below 10%".
3.  **Past Learnings**: "Last time we tried a 5% discount on VSOP, it failed."

#### B. The Tool Layer (Sources of Truth)
We expose specific, high-fidelity tools.
*   `inventory.tool.ts`: **The Source of Truth**. Wraps Saleor/FIFO services. Answers "Do we *actually* have stock?" and "What is the *exact* cost?".
*   `profit-calculator.tool.ts`: **The Safety Check**. Ensures we never propose a loss-making promo.
*   `promo-history.tool.ts`: **The Memory**. "What promos worked for this product before?"

#### C. The Knowledge Base (`ai_knowledge_base`)
A simple Postgres table to store "Rules" and "Learnings".
*   `rule_type`: "hard_constraint" | "soft_preference" | "correction"
*   `content`: "Don't suggest bundles for high-end whisky."
*   `confidence`: 0.0 - 1.0

---

## 3. Implementation Plan

### Phase 1: Foundation & Architecture (Current)
*   [x] Scaffold `packages/ai`.
*   [x] Install Vercel AI SDK & OpenLLMetry.
*   [ ] **Implement `inventory.tool.ts`** (Priority: Truth).
*   [ ] Create `ContextEngine` stub.

### Phase 2: The "Back-in-Stock" Pilot (The Vertical Slice)
**Goal**: Automate "Product Back in Stock -> Promo Proposal" using the full loop.

1.  **Trigger**: Webhook / API call `POST /api/ai/events/back-in-stock`.
2.  **Context**: Fetch product details, past performance of this product.
3.  **Agent**: "Propose a promo for [Product X]."
4.  **Tool Use**: Agent checks `inventory.tool` (confirm stock) and `profit.tool` (check margins).
5.  **Output**: Structured `DraftOrder` proposal.

### Phase 3: Evals & Simulation
**Goal**: "Sleep at night."

*   **Simulated Evals**: A script that runs the agent against 100 historical "back in stock" events.
*   **Success Metric**: % of proposals that are (1) Profitable, (2) In Stock, (3) Compliant.
*   **Regression Testing**: Ensure new prompts don't break old logic.

---

## 4. Best Practices Checklist

1.  **Tools must be Read-Only (mostly)**: The agent *reads* inventory. It *drafts* orders. It never *commits* without human approval (initially).
2.  **Fail Gracefully**: If the Context Engine can't find data, the Agent should say "I don't know", not hallucinate.
3.  **Structured Everything**: Inputs are Zod. Outputs are Zod. No free text parsing.
4.  **Evals from Day 1**: We don't ship without running the simulation script.

## 5. Next Steps

1.  Implement `inventory.tool.ts` wrapping `fifoService` and `productService`.
2.  Create the `ContextEngine` structure.
