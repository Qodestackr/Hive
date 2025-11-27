# 12 Factor Agents: Gap Analysis & Roadmap

> **Context**: This document analyzes Promco's current AI implementation against the 12 Factor Agents methodology and provides a clear roadmap to production-ready AI.

## Quick Reference: The 12 Factors

1. **Natural Language → Tool Calls**: LLMs convert messy input to structured actions
2. **Own Your Prompts**: Version, test, and measure prompts like code
3. **Own Your Context Window**: Actively manage what the LLM sees
4. **Tools = Structured Outputs**: Enforce schemas, no magic
5. **Unify Execution & Business State**: Track both workflow progress and business outcomes
6. **Launch/Pause/Resume**: Agents must be pausable and recoverable
7. **Contact Humans (HITL)**: Escalate to humans via tool calls
8. **Own Your Control Flow**: Explicit routing, LLM handles decisions only
9. **Compact Errors into Context**: Turn failures into learnings
10. **Small, Focused Agents**: 3-10 steps max, single responsibility
11. **Trigger from Anywhere**: Channel-agnostic design
12. **Stateless Reducer**: Pure (state, event) → newState functions

---

## Current State: What We Have ✅

### Strong Foundation
- ✅ **Factor 1 (Tool Calls)**: `inventoryTool` and `profitCalculatorTool` work well
- ✅ **Factor 4 (Structured Outputs)**: Zod schemas everywhere
- ✅ **Factor 8 (Control Flow)**: Sandwich pattern (deterministic → AI → deterministic)
- ✅ **Factor 11 (Channel-Agnostic)**: Design supports multiple triggers
- ⚠️ **Factor 10 (Small Agents)**: Have 1 agent (BackInStock), need more

### Good Progress
- ⚠️ **Factor 2 (Own Prompts)**: **NOW IMPLEMENTED** - Versioned prompt system in place
- ⚠️ **Factor 7 (HITL)**: Basic threshold check exists, but no actual infrastructure

---

## Critical Gaps: What's Missing ❌

| Factor | Status | Impact | Effort |
|--------|--------|--------|--------|
| **F3: Context Window** | ❌ Missing | High - Will fail on long conversations | Medium (2-3 days) |
| **F5: Unified State** | ❌ Missing | High - Cannot track workflow progress | Medium (3-4 days) |
| **F6: Pause/Resume** | ❌ Missing | **Critical** - No HITL possible without this | High (5-7 days) |
| **F7: HITL** | ❌ Infrastructure missing | **Critical** - Customer trust depends on this | High (5-7 days) |
| **F9: Error Learning** | ❌ Missing | Medium - AI won't improve over time | Low (1-2 days) |
| **F12: Stateless Reducer** | ❌ Wrong pattern | **Critical** - Cannot scale horizontally | High (4-6 days) |

---

## The Roadmap: 4 Weeks to Production

### Week 1: State & Persistence (Foundations)
**Goal**: Enable pause/resume capability

- [ ] Design `AgentState` schema (execution + business state unified)
- [ ] Create `ai_agent_state` database table
- [ ] Implement state persistence layer
- [ ] Add checkpoint/recovery mechanism
- [ ] **Milestone**: Can save/load agent state

**Why This First**: Everything else depends on state management.

---

### Week 2: Refactor to Reducer Pattern (Architecture)
**Goal**: Make agents stateless and scalable

- [ ] Refactor `BackInStockAgent` from class to pure reducer
- [ ] Implement `(state, event) → newState` pattern
- [ ] Add event sourcing (store all events, replay to reconstruct state)
- [ ] Write integration tests for state transitions
- [ ] **Milestone**: Agent is stateless, can run on any worker

**Why This Matters**: Horizontal scaling, crash recovery, audit trails.

---

### Week 3: HITL Infrastructure (Trust & Safety)
**Goal**: Enable human oversight for high-stakes decisions

- [ ] Build `HITLManager` service
- [ ] Create approval API endpoints (`/api/ai/approvals`)
- [ ] Build approval dashboard UI
- [ ] Implement notification system (Slack/Email)
- [ ] Add timeout/escalation logic
- [ ] **Milestone**: Humans can approve/reject AI proposals

**Customer Value**: "We review high-value orders before finalizing."

---

### Week 4: Conversational Commerce (ROI!)
**Goal**: Deploy customer-facing features

- [ ] Build `PromoRedemptionAgent` (WhatsApp code redemption)
- [ ] Build `CustomerCaptureAgent` (opt-in flows)
- [ ] Deploy WhatsApp webhook (`/api/ai/whatsapp`)
- [ ] Add Swahili/English NLP extraction
- [ ] Pilot with 10 distributors
- [ ] **Milestone**: Customers redeem promos via WhatsApp

**Customer Value**: "Find users where they are" - natural engagement.

---

## Implementation Priorities (What to Build First)

### P0: Must Have for Production
1. **State Management** (F5, F6) - Without this, nothing else works
2. **HITL Infrastructure** (F7) - Customer trust requires human oversight
3. **Stateless Reducer** (F12) - Cannot scale without this

### P1: High Value, Soon
4. **Context Window Management** (F3) - Needed for multi-turn conversations
5. **Error Learning** (F9) - AI improves over time
6. **Conversational Promo Redemption** - Direct ROI

### P2: Nice to Have
7. **More Micro-Agents** (F10) - CampaignHealth, InventoryOptimizer
8. **A/B Testing for Prompts** (F2) - Already versioned, add testing
9. **Advanced Evals** - Continuous validation

---

## Success Criteria

### Technical
- ✅ All agents are **stateless reducers** (can replay from events)
- ✅ All high-value actions **require HITL approval**
- ✅ Context window stays **<8K tokens** even in 20-turn conversations
- ✅ **99.9% uptime** (proven via horizontal scaling)
- ✅ **<500ms** p95 latency for agent decisions

### Business (ROI Metrics for Customer)
- ✅ **3x** increase in promo redemptions (WhatsApp vs. manual)
- ✅ **50%** reduction in campaign planning time
- ✅ **KES 200K+** monthly profit saved via pre-flight checks
- ✅ **80%** HITL approval rate (high trust)

---

## The "Why" Behind Each Factor

### Factor 6: Pause/Resume (Most Critical)
**Why**: Without this, HITL is impossible. If agent crashes mid-approval, you lose the workflow.

**Real Example**:
```
1. User redeems KES 50,000 promo
2. Agent requests HITL approval
3. (Server restarts during human review)
4. ❌ Without F6: Approval lost, user frustrated
5. ✅ With F6: Workflow resumes, approval completes
```

### Factor 7: HITL (Customer Trust)
**Why**: Thika distributor sees tech as alien. HITL proves "we're in control, not AI."

**Customer Messaging**:
- "AI proposes, you approve"
- "We never auto-finalize orders >KES 10,000"
- "Your compliance officer can review every decision"

### Factor 12: Stateless Reducer (Scale & Reliability)
**Why**: 
- **Crash Recovery**: Replay events to reconstruct state
- **Horizontal Scaling**: Any worker can handle any workflow
- **Audit Trail**: Event log shows every decision

**Real Example**:
```typescript
// Event 1: message_received
state = reducer(initialState, { type: 'message_received', message: '...' })

// Event 2: code_extracted
state = reducer(state, { type: 'code_extracted', code: 'TUSKER50' })

// Event 3: validation_complete
state = reducer(state, { type: 'validation_complete', valid: true })

// (Crash here - no problem!)

// On restart: Replay events 1-3 to reconstruct state
finalState = events.reduce(reducer, initialState)
```

---

## Quick Wins (Week 1)

Before tackling big architectural changes, ship these quick wins:

### 1. Prompt Monitoring Dashboard
- Show which prompt version is active
- Track usage per version
- Measure profit accuracy per version
- **Effort**: 1 day
- **Value**: Know if a new prompt breaks something

### 2. Error Categorization
- Classify errors: `inventory_missing`, `profit_loss_detected`, `api_timeout`
- Log to `ai_knowledge_base` table
- **Effort**: 1 day
- **Value**: Foundation for Factor 9 (error learning)

### 3. Context Window Metrics
- Track tokens used per agent call
- Alert if approaching limit (8K tokens)
- **Effort**: 0.5 days
- **Value**: Know when to implement Factor 3

---

## Anti-Patterns to Avoid

### ❌ Framework Dependency
Don't rebuild everything on LangChain/LangGraph. The current Effect-based approach is cleaner.

**Why**: 12-factor isn't about frameworks, it's about principles.

### ❌ "AI Will Figure It Out"
Don't let LLM control flow. YOU control flow, LLM handles decisions.

**Example**:
```typescript
// ❌ Bad: Let LLM decide what to do next
while (true) {
  action = await llm.decideWhatToDo(state)
  await execute(action)
}

// ✅ Good: Explicit flow, LLM picks parameters
const code = await llm.extractCode(message) // LLM decision
const validation = await db.validate(code) // Your code
if (!validation.valid) return error() // Your code
const draft = await createOrder(code) // Your code
if (draft.value > 10000) return requestHITL() // Your code
```

### ❌ Stateful Agents in Memory
Don't store state in JS class instances. They don't survive restarts.

**Fix**: Factor 12 - store state in database, make agents pure reducers.

---

## Next Steps

1. **Review Implementation Plan** → See artifacts directory
2. **Review Task Breakdown** → See artifacts directory
3. **Start with Week 1**: State Management (foundations)
4. **Ship Quick Wins**: Prompt monitoring, error categorization

---

## Resources

- [12 Factor Agents (GitHub)](https://github.com/humanlayer/12-factor-agents)
- [HumanLayer Docs](https://humanlayer.dev)
- [Intercom Fin Case Study](https://www.intercom.com/blog/how-we-built-fin)
- Current Implementation: `packages/ai/src`
