# Production AI Systems: The Real Engineering Guide
## How to Build AI That Actually Works (and Creates Real Value)

---

## The Core Truth

**Most AI agents hit 70-80% functionality, then collapse.**

Why? Because people build "AI-first" when they should build "deterministic-first with AI sprinkled in."

**Real production AI is:**
- 80% deterministic software engineering
- 15% smart context management
- 5% LLM calls at precise decision points

Not the other way around.

---

## Part 1: Why Most AI Fails

### The Framework Trap

Developers grab LangChain/LangGraph, get a quick demo working, then hit reality:

```python
# What you think you're building:
agent = AutomagicAgent(
    prompt="solve customer problems",
    tools=[all_the_tools]
)
agent.run()  # Magic! 🎉

# What actually happens:
- Infinite loops on edge cases
- Hallucinated tool calls with invalid JSON
- Context window explodes after 5 messages
- Makes up answers instead of saying "I don't know"
- The last 20% requires rebuilding from scratch
```

### The Real Pattern

Companies that win (Intercom's Fin, Chargeflow) learned this early:

**LLMs are components in deterministic systems, not the system itself.**

```python
# Wrong: Let the LLM control everything
while True:
    action = llm.decide_what_to_do(context)  # Hope it works
    execute(action)

# Right: You control flow, LLM handles decisions
def handle_promo_redemption(user_message):
    # Deterministic: You own the flow
    code = extract_code_with_llm(user_message)  # LLM step
    
    # Deterministic: Traditional validation
    validation = validate_in_database(code)
    if not validation.valid:
        return f"Code invalid: {validation.reason}"
    
    # Deterministic: Business logic
    compliance = check_age_compliance(user_phone)
    if not compliance.ok:
        return "Age verification required"
    
    # Deterministic: API call
    draft = create_saleor_order(code, validation.discount)
    
    # Deterministic: Human gate
    if draft.value > 10000:
        return request_human_approval(draft)
    
    return finalize_order(draft)
```

**See the pattern? The LLM only extracts the code. Everything else is YOUR code.**

---

## Part 2: How Fin Actually Works (and Why It Matters)

### The $100M Commitment

Intercom didn't bolt AI onto existing software. They:
- Reorganized entire product teams around AI
- Canceled non-AI projects
- Built infrastructure specifically for AI workloads
- Committed to **architecture designed for change**

### The 5-Layer Architecture (The Real Engineering)

**Layer 1: Query Refinement**
```python
# Not: Raw user message → LLM
# But: Optimize message for retrieval

def refine_query(raw_message):
    # Customer: "My thing broke idk how to fix plz help"
    # Becomes: "Customer reports Feature X malfunction in Product Y"
    
    refined = llm.optimize_for_search(
        message=raw_message,
        context=conversation_history[-3:]  # Only recent context
    )
    return refined
```

**Layer 2: Intent Router (Deterministic)**
```python
# Decide: LLM, automation, or human?

def route_message(message):
    # Check pre-configured automations FIRST (deterministic)
    if matches_automation_trigger(message):
        return handle_automation(message)
    
    # Check for custom answers (deterministic)
    if has_custom_answer(message):
        return fetch_custom_answer(message)
    
    # Only then: Route to LLM
    return handle_with_llm(message)
```

**Layer 3: RAG with Reranking (The Secret Sauce)**
```python
# Not: Throw everything at LLM
# But: Retrieve → Rerank → Select best

def get_context(query):
    # Retrieve candidates
    candidates = vector_search(query, top_k=20)
    
    # Rerank with custom model (trained for YOUR domain)
    reranked = custom_reranker.score(
        query=query,
        candidates=candidates
    )
    
    # Select only high-confidence results
    context = [c for c in reranked if c.score > 0.7][:5]
    
    return context

# Key: They measure EACH step independently
assert retrieval_precision > 0.85
assert reranking_improvement > 0.15
```

**Layer 4: LLM Generation (Smart Model Routing)**
```python
# Not: Always use "best" model
# But: Route to right model for the job

def generate_response(query, context):
    # Simple question? Use fast model
    if is_simple_factual(query):
        return gemini_flash.generate(query, context)
    
    # Complex reasoning? Use capable model
    if requires_multi_step_reasoning(query):
        return claude_sonnet.generate(query, context)
    
    # They tested: GPT-4 vs Claude on THEIR data
    # Result: Claude won for customer service
    # Your results will differ!
```

**Layer 5: Output Validation (Critical)**
```python
# Never send LLM output directly to user

def validate_response(response, context):
    checks = {
        "hallucination": detect_hallucination(response, context),
        "policy_compliance": check_against_policies(response),
        "tone": check_tone_appropriate(response),
        "citations": verify_citations_exist(response)
    }
    
    if any(checks.values()):
        # Regenerate or escalate to human
        return regenerate_with_constraints(checks)
    
    return response
```

### The Fin Flywheel (Continuous Improvement)

```
1. Train on policies/procedures
2. Test performance (BEFORE launch)
3. Deploy across channels
4. Measure everything
5. Improve with data
6. Repeat
```

**Key insight:** Every change is measured. Every improvement is validated with evals.

### Why Fin Says "I Don't Know"

```python
# Most chatbots:
if no_confident_answer:
    return llm.make_something_up()  # Disaster

# Fin:
if confidence < threshold:
    return escalate_to_human(
        reason="Outside knowledge base",
        context=full_conversation
    )
```

**This is architectural.** Fin is designed to be humble.

---

## Part 3: The 12 Factor Agents Framework

After interviewing 100+ AI builders, Dex Horthy found patterns that actually work.

**Core insight:** Agents are just software. Treat them like software.

### Factor 1: Natural Language → Structured Data

**This is the LLM superpower.**

```python
# Input: Natural language (messy)
"I have promo code TUSKER50 for my order, phone is 0700123456"

# Output: Structured data (clean)
{
  "action": "redeem_promo",
  "code": "TUSKER50",
  "phone": "+254700123456",
  "products": []
}
```

**Real implementation:**

```python
import google.generativeai as genai

def extract_structured_data(user_message):
    prompt = f"""
    Extract structured data from: "{user_message}"
    
    Return valid JSON only:
    {{
        "action": "redeem_promo" | "inquire" | "other",
        "code": "CODE" or null,
        "phone": "+254..." or null,
        "products": ["item1", "item2"] or []
    }}
    """
    
    response = llm.generate(prompt)
    return json.loads(response)  # Your validation here

# The LLM's job ENDS at JSON generation
# Everything after is deterministic code
```

**Why this matters:** You're not asking the LLM to "be smart about promos." You're asking it to do ONE thing: extract structure from chaos.

### Factor 2: Own Your Prompts

**Prompts are first-class code.** Treat them like it.

```python
# Bad: Prompts buried in framework config
agent = LangChain(prompt="be helpful")  # What does this even do?

# Good: Prompts as versioned code
PROMO_EXTRACTION_PROMPT_V3 = """
You are a promo code extractor for Kenyan liquor distributors.

Rules:
1. Promo codes are UPPERCASE + numbers (e.g., TUSKER50, BEER20)
2. Extract phone in E.164 format (+254...)
3. Handle Swahili/English code-switching
4. Return JSON only

Examples:
- "Nina code TUSKER50" → {{"code": "TUSKER50"}}
- "Nataka discount, my number ni 0700123456" → {{"phone": "+254700123456"}}

User: {user_message}
"""

# Now you can:
# - Version control it
# - A/B test versions
# - Measure performance per version
# - Debug when it breaks
```

**When something fails, you know EXACTLY what instructions you sent.**

### Factor 3: Own Your Context Window

**Don't blindly append everything. Actively manage what the LLM sees.**

```python
# Bad: Context explosion
conversation = []
while True:
    user_msg = get_message()
    conversation.append(user_msg)  # Eventually: Out of tokens
    response = llm.ask(conversation)
    conversation.append(response)

# Good: Context engineering
class ConversationState:
    def __init__(self):
        self.extracted_facts = {}  # Structured facts
        self.recent_messages = []  # Last 3-5 only
        self.user_intent = None
    
    def add_message(self, msg, response):
        # Extract facts (compress)
        facts = extract_facts(msg)
        self.extracted_facts.update(facts)
        
        # Keep recent (sliding window)
        self.recent_messages.append({
            "user": summarize(msg),
            "bot": summarize(response)
        })
        if len(self.recent_messages) > 5:
            self.recent_messages.pop(0)
    
    def get_context_for_llm(self):
        return f"""
        Known facts: {self.extracted_facts}
        Recent conversation: {self.recent_messages}
        Current intent: {self.user_intent}
        """

# Now: Handles 50+ message conversations without exploding
```

**This is the difference between demo and production.**

### Factor 4: Tools Are Just Structured Outputs

```python
# "Tool calling" is just:
# 1. LLM outputs JSON
# 2. You validate schema
# 3. You execute deterministic code

def handle_tool_call(user_message):
    # LLM decides what to do (outputs JSON)
    decision = llm.generate(
        prompt=f"User: {user_message}. What tool?",
        tools_schema=[validate_promo, create_order]
    )
    
    # You validate
    if not is_valid_json(decision):
        return handle_error("Invalid tool call")
    
    # You execute (deterministic)
    if decision.tool == "validate_promo":
        result = validate_promo(decision.params["code"])
    elif decision.tool == "create_order":
        result = create_order(decision.params)
    
    return result
```

**No magic. Just JSON → validation → execution.**

### Factor 5: Unify Execution State and Business State

```python
# Keep these synchronized or everything breaks

class PromoRedemptionState:
    # Execution state (where are we in the workflow?)
    current_step: str  # "extracting_code", "validating", "creating_order"
    llm_calls_made: int
    errors_encountered: list
    
    # Business state (what's the actual status?)
    promo_code: str
    validation_result: dict
    order_id: str
    approval_status: str
    
    def advance_to(self, next_step):
        # Update both states together
        self.current_step = next_step
        self.llm_calls_made += 1
        log_state_transition(self)

# If these diverge, you get:
# - "Order created" but no order_id
# - "Waiting for approval" but order already finalized
# - Impossible to debug
```

### Factor 6: Launch/Pause/Resume

**Your agents must be pausable.** Why? Human approval, error recovery, cost control.

```python
# Not: Infinite loop until done
while not done:
    action = llm.decide()
    execute(action)

# But: State machine
class PromoAgent:
    def __init__(self, state=None):
        self.state = state or PromoRedemptionState()
    
    def step(self):
        """Execute ONE step, then pause"""
        if self.state.current_step == "extract_code":
            code = extract_code(self.state.user_message)
            self.state.promo_code = code
            self.state.current_step = "validate"
            return "continue"
        
        elif self.state.current_step == "validate":
            result = validate_promo(self.state.promo_code)
            self.state.validation_result = result
            if result.valid:
                self.state.current_step = "create_draft"
                return "continue"
            else:
                return "done_invalid"
        
        elif self.state.current_step == "create_draft":
            draft = create_order(self.state)
            self.state.order_id = draft.id
            self.state.current_step = "await_approval"
            return "pause_for_human"  # PAUSE HERE
        
        elif self.state.current_step == "finalize":
            finalize_order(self.state.order_id)
            return "done_success"
    
    def resume(self, approval_decision):
        """Resume after human decision"""
        if approval_decision.approved:
            self.state.current_step = "finalize"
            return self.step()
        else:
            return "done_rejected"

# Now you can:
# - Save state to database
# - Resume hours later
# - Scale horizontally (different workers)
# - Recover from crashes
```

### Factor 7: Human Escalation is a Feature

```python
# Not: Hope the LLM handles everything
response = llm.answer(query)  # Might hallucinate

# But: Design for escalation
def handle_query(query, context):
    # Try to answer
    response = llm.generate(query, context)
    confidence = calculate_confidence(response, context)
    
    # Escalate if uncertain
    if confidence < 0.7:
        return {
            "action": "escalate_to_human",
            "reason": "Low confidence answer",
            "draft_response": response,
            "context": context
        }
    
    return response

# Human escalation isn't failure—it's good design
```

**Real example:**

```python
# Promo redemption with high-value gate
def process_redemption(code, order_value):
    validation = validate_promo(code)
    
    if not validation.valid:
        return "Code invalid"
    
    draft = create_draft_order(code, order_value)
    
    # Automatic HITL threshold
    if order_value > 10000:
        return {
            "status": "pending_approval",
            "reason": "High-value order requires manual review",
            "order_id": draft.id,
            "notify": "compliance_team"
        }
    
    # Auto-approve low-value
    return finalize_order(draft.id)
```

### Factor 8: Own Your Control Flow

**This is THE critical factor.**

```python
# Most frameworks: Hope the LLM figures out the flow
agent.run(goal="redeem promo")  # What steps? Who knows!

# You: Explicitly define the flow
def promo_redemption_flow(user_message, user_phone):
    """
    Explicit flow:
    1. Extract code (LLM)
    2. Validate code (Database)
    3. Check compliance (API)
    4. Create draft (Saleor API)
    5. Get approval (Human)
    6. Finalize (Saleor API)
    """
    
    # Step 1: LLM extracts code
    extracted = llm_extract(user_message)
    if not extracted.code:
        return {"error": "No promo code found"}
    
    # Step 2: Deterministic validation
    validation = db_validate(extracted.code)
    if not validation.valid:
        return {"error": validation.reason}
    
    # Step 3: Deterministic compliance
    compliance = check_age(user_phone)
    if not compliance.verified:
        return {"error": "Age verification required"}
    
    # Step 4: Deterministic API call
    draft = saleor_create_draft(
        code=extracted.code,
        phone=user_phone,
        discount=validation.discount
    )
    
    # Step 5: Human gate (deterministic threshold)
    if draft.value > 10000:
        approval_id = request_approval(draft)
        return {
            "status": "pending",
            "approval_id": approval_id
        }
    
    # Step 6: Deterministic finalization
    order = saleor_finalize(draft.id)
    return {"status": "success", "order": order}
```

**You own the switch statement. Not the LLM. Not the framework.**

### Factor 9: Compact Errors into Context

```python
# Bad: Dump stack traces into context
try:
    result = api_call()
except Exception as e:
    context.append(str(e))  # 2000 characters of noise

# Good: Compress to teachable moments
try:
    result = validate_promo(code)
except PromoNotFound:
    context.append({
        "error": "promo_not_found",
        "code": code,
        "action": "Ask user to verify code spelling"
    })
except PromoExpired as e:
    context.append({
        "error": "promo_expired",
        "expired_date": e.expiry,
        "action": "Inform user politely, suggest alternatives"
    })

# The LLM learns: "When promo_not_found, ask for verification"
```

### Factor 10: Small, Focused Agents

```python
# Not: One mega-agent that does everything
SuperAgent(
    capabilities=[
        "extract_promo",
        "validate_promo",
        "check_inventory",
        "process_payment",
        "handle_shipping",
        "customer_support",
        # ... 50 more things
    ]
)  # Impossible to debug, test, or reason about

# But: Many small agents
PromoExtractionAgent()  # 1 job: Extract codes from messages
ValidationAgent()       # 1 job: Validate codes
ComplianceAgent()       # 1 job: Check age/location
OrderAgent()            # 1 job: Create/finalize orders

# Each is 3-10 steps max
# Each is independently testable
# Each has clear inputs/outputs
```

**Real implementation:**

```python
# Promo extraction agent (tiny, focused)
class PromoExtractionAgent:
    def __init__(self):
        self.prompt = EXTRACTION_PROMPT_V3
    
    def extract(self, user_message: str) -> dict:
        """
        One job: Extract promo code + phone from message
        Returns: {"code": str, "phone": str, "confidence": float}
        """
        response = llm.generate(self.prompt.format(message=user_message))
        return self._parse_and_validate(response)

# Validation agent (deterministic, no LLM!)
class ValidationAgent:
    def validate(self, code: str) -> dict:
        """
        One job: Check if code is valid
        Returns: {"valid": bool, "discount": float, "reason": str}
        """
        result = db.query("SELECT * FROM promo_codes WHERE code = ?", code)
        return self._check_validity(result)

# Orchestrator ties them together
def redeem_promo(user_message, user_phone):
    extracted = PromoExtractionAgent().extract(user_message)
    validation = ValidationAgent().validate(extracted["code"])
    
    if validation["valid"]:
        return create_order(extracted["code"], user_phone)
    else:
        return {"error": validation["reason"]}
```

### Factor 11: Trigger from Anywhere

```python
# Your agent should be channel-agnostic

class PromoRedemptionAgent:
    def process(self, event: dict) -> dict:
        """
        Stateless processor:
        Input: {message, phone, channel}
        Output: {status, response, next_action}
        """
        # Extract regardless of channel
        extracted = self.extract(event["message"])
        
        # Process (same logic everywhere)
        result = self.validate_and_create(extracted, event["phone"])
        
        # Format response for channel
        return self.format_for_channel(result, event["channel"])

# Now trigger from anywhere:
# - WhatsApp webhook: agent.process(whatsapp_event)
# - Web chat: agent.process(web_event)
# - SMS: agent.process(sms_event)
# - USSD: agent.process(ussd_event)
```

### Factor 12: Make Your Agent a Stateless Reducer

**The most important architectural pattern.**

```python
# Not: Agent maintains state in memory
class Agent:
    def __init__(self):
        self.state = {}  # Lost on restart
    
    def process(self, event):
        self.state.update(event)  # Can't scale horizontally

# But: Pure function (state, event) → new_state
def promo_agent_reducer(state: dict, event: dict) -> dict:
    """
    Pure function: Given current state + new event, return new state
    
    This enables:
    - Pause/resume (state saved to DB)
    - Horizontal scaling (any worker can process)
    - Time travel debugging (replay events)
    - Audit trails (every state transition logged)
    """
    
    if event["type"] == "message_received":
        return {
            **state,
            "current_step": "extracting_code",
            "user_message": event["message"]
        }
    
    elif event["type"] == "code_extracted":
        return {
            **state,
            "current_step": "validating",
            "promo_code": event["code"]
        }
    
    elif event["type"] == "validation_complete":
        if event["valid"]:
            return {
                **state,
                "current_step": "creating_order",
                "discount": event["discount"]
            }
        else:
            return {
                **state,
                "current_step": "done",
                "status": "invalid_code",
                "reason": event["reason"]
            }
    
    return state

# Usage with database persistence
def process_event(redemption_id, event):
    # Load current state from DB
    state = db.load_state(redemption_id)
    
    # Apply event (pure function)
    new_state = promo_agent_reducer(state, event)
    
    # Save new state to DB
    db.save_state(redemption_id, new_state)
    
    return new_state
```

---

## Part 4: The Real Engineering Leverage

### What Actually Creates Value

**Not:**
- ❌ Clever prompts
- ❌ Fine-tuning models
- ❌ Bigger frameworks
- ❌ More "agentic" behaviors

**But:**
- ✅ **Context engineering** (right info at right time)
- ✅ **Bounded scope** (small agents, clear jobs)
- ✅ **Explicit control flow** (you decide logic)
- ✅ **Evaluation & measurement** (test each step)
- ✅ **Graceful degradation** (escalate to humans)
- ✅ **State management** (pause/resume/scale)

### The Three-Layer Mental Model

**Every production AI system has:**

**Layer 1: Deterministic Backbone (80% of code)**
```python
# Control flow
def handle_redemption(message, phone):
    if not is_valid_phone(phone):  # Deterministic
        return error("Invalid phone")
    
    # ... more deterministic checks
    
# Data validation
def validate_promo_format(code):
    if not re.match(r'^[A-Z]{3,10}\d{0,3}$', code):
        return False
    return True

# API orchestration
def create_order(code, phone):
    return saleor.create_draft_order(...)

# Error handling
try:
    result = process()
except KnownError as e:
    handle_gracefully(e)

# Human escalation
if needs_approval(order):
    return queue_for_human()
```

**Layer 2: LLM Reasoning Points (15% of code)**
```python
# Natural language understanding
extracted = llm.extract_promo_info(user_message)

# Intent classification
intent = llm.classify_intent(message)

# Context refinement
refined = llm.optimize_for_search(query)

# Multi-step reasoning
plan = llm.create_action_plan(goal, context)

# Answer generation
response = llm.generate_response(query, context)
```

**Layer 3: Observability & Feedback (5% of code)**
```python
# Measure each step
log_llm_call(prompt, response, latency, tokens)
log_tool_call(tool_name, params, result, latency)
log_state_transition(old_state, new_state, event)

# A/B testing
if user_in_test_group("prompt_v4"):
    prompt = PROMPT_V4
else:
    prompt = PROMPT_V3

# User feedback loops
record_thumbs_up_down(response_id, feedback)

# Continuous eval
daily_eval_run(test_suite)

# Cost tracking
track_costs(tokens_used, model_name)
```

### The Cost of Not Doing This

**Without proper engineering:**
- Days 1-10: Demo works, everyone excited
- Days 10-30: Hit 70-80% quality, stuck
- Days 30-90: Realize you need to rebuild
- Result: 6-month project becomes 18+ months

**With proper engineering (like Intercom):**
- Commit resources upfront
- Build infrastructure first
- Measure every step
- Iterate in weeks, not months

---

## Part 5: How to Apply This (Real Code)

### Week 1: Basic Tool Call

```python
import google.generativeai as genai

genai.configure(api_key="YOUR_KEY")
model = genai.GenerativeModel('gemini-2.0-flash-exp')

# Define ONE tool
validate_promo_tool = {
    "name": "validate_promo",
    "description": "Validate a promo code and return discount",
    "parameters": {
        "type": "object",
        "properties": {
            "code": {"type": "string", "description": "Promo code"}
        },
        "required": ["code"]
    }
}

# The actual tool (deterministic!)
def validate_promo(code: str) -> dict:
    result = db.query("SELECT * FROM promo_codes WHERE code = ?", code)
    if not result:
        return {"valid": False, "reason": "Code not found"}
    if result.expired:
        return {"valid": False, "reason": "Code expired"}
    return {"valid": True, "discount": result.discount_percent}

# Agent that calls tool
def chat(user_message: str) -> str:
    # LLM decides to call tool
    response = model.generate_content(
        user_message,
        tools=[validate_promo_tool]
    )
    
    # Check if tool call requested
    part = response.candidates[0].content.parts[0]
    if hasattr(part, 'function_call'):
        # Execute the tool (deterministic)
        code = part.function_call.args["code"]
        result = validate_promo(code)
        
        # LLM generates final response
        final = model.generate_content([
            {"role": "user", "parts": [user_message]},
            {"role": "model", "parts": [response.candidates[0].content]},
            {"role": "function", "parts": [{
                "function_response": {
                    "name": "validate_promo",
                    "response": result
                }
            }]}
        ])
        return final.text
    
    return response.text

# Test
print(chat("I have code TUSKER50"))
```

**That's it. That's 90% of AI agents.**

### Week 2: Chain Multiple Tools

```python
tools = [
    validate_promo_tool,
    {
        "name": "create_draft_order",
        "description": "Create draft order in Saleor",
        "parameters": {
            "type": "object",
            "properties": {
                "promo_code": {"type": "string"},
                "phone": {"type": "string"},
                "discount": {"type": "number"}
            },
            "required": ["promo_code", "phone"]
        }
    }
]

def handle_redemption(user_message: str, user_phone: str):
    context = []
    
    # Let LLM orchestrate tools
    response = model.generate_content(
        f"User ({user_phone}): {user_message}",
        tools=tools
    )
    
    # Execute tools as LLM requests them
    while has_function_call(response):
        func = response.function_call
        
        if func.name == "validate_promo":
            result = validate_promo(func.args["code"])
        elif func.name == "create_draft_order":
            result = create_draft_order(
                func.args["promo_code"],
                func.args["phone"],
                func.args.get("discount", 0)
            )
        
        # Add to context and continue
        context.append({"function": func.name, "result": result})
        response = model.generate_content(context)
    
    return response.text
```

### Week 3: Add Human-in-the-Loop

```python
def handle_redemption_with_approval(message, phone):
    # Steps 1-2: Extract and validate (automated)
    extracted = extract_with_llm(message)
    validation = validate_promo(extracted["code"])
    
    if not validation["valid"]:
        return {"error": validation["reason"]}
    
    # Step 3: Create draft (automated)
    draft = create_draft_order(
        code=extracted["code"],
        phone=phone,
        discount=validation["discount"]
    )
    
    # Step 4: HUMAN GATE
    if draft["value"] > 10000:
        approval_id = save_pending_approval({
            "draft_id": draft["id"],
            "code": extracted["code"],
            "value": draft["value"],
            "phone": phone,
            "status": "pending"
        })
        
        notify_approval_queue(approval_id)
        
        return {
            "status": "pending_approval",
            "approval_id": approval_id,
            "message": "Order pending approval (high value)"
        }
    
    # Step 5: Auto-finalize low-value orders
    order = finalize_order(draft["id"])
    return {"status": "success", "order": order}

# Human approval endpoint
def approve_redemption(approval_id, approved, admin_user):
    approval = db.get_approval(approval_id)
    
    if approved:
        # Human approved: finalize the order
        order = finalize_order(approval["draft_id"])
        
        # Update approval record
        db.update_approval(approval_id, {
            "status": "approved",
            "approved_by": admin_user,
            "approved_at": datetime.now(),
            "order_id": order["id"]
        })
        
        # Increment promo usage
        db.increment_promo_usage(approval["code"])
        
        return {"status": "approved", "order": order}
    else:
        # Human rejected
        db.update_approval(approval_id, {
            "status": "rejected",
            "rejected_by": admin_user,
            "rejected_at": datetime.now()
        })
        
        # Optionally: Delete draft order
        saleor.delete_draft(approval["draft_id"])
        
        return {"status": "rejected"}
```

### Week 4: Own the Orchestration

```python
# Now you control EVERYTHING explicitly

class PromoRedemptionOrchestrator:
    """
    Explicit orchestrator - YOU own the control flow
    No framework magic, no hoping LLM figures it out
    """
    
    def __init__(self):
        self.extraction_agent = PromoExtractionAgent()
        self.validation_service = ValidationService()
        self.compliance_checker = ComplianceChecker()
        self.order_service = OrderService()
        self.approval_queue = ApprovalQueue()
    
    def process(self, user_message: str, user_phone: str) -> dict:
        """
        Main orchestration flow
        Each step is explicit, deterministic, testable
        """
        
        # Step 1: Extract (LLM)
        try:
            extracted = self.extraction_agent.extract(user_message)
            if not extracted["code"]:
                return self._handle_no_code()
        except Exception as e:
            return self._handle_extraction_error(e)
        
        # Step 2: Validate (Database)
        validation = self.validation_service.validate(extracted["code"])
        if not validation["valid"]:
            return self._handle_invalid_code(validation)
        
        # Step 3: Compliance (API)
        compliance = self.compliance_checker.check(user_phone)
        if not compliance["approved"]:
            return self._handle_compliance_failure(compliance)
        
        # Step 4: Create draft (API)
        try:
            draft = self.order_service.create_draft(
                code=extracted["code"],
                phone=user_phone,
                discount=validation["discount"]
            )
        except Exception as e:
            return self._handle_order_creation_error(e)
        
        # Step 5: Approval gate (Deterministic threshold)
        if self._requires_manual_approval(draft):
            approval_id = self.approval_queue.add(draft, extracted["code"])
            return {
                "status": "pending_approval",
                "approval_id": approval_id,
                "estimated_wait": "5-10 minutes"
            }
        
        # Step 6: Auto-finalize (API)
        order = self.order_service.finalize(draft["id"])
        
        # Step 7: Log success metrics
        self._log_successful_redemption(
            code=extracted["code"],
            order_value=order["value"],
            discount_applied=validation["discount"]
        )
        
        return {
            "status": "success",
            "order_id": order["id"],
            "discount_applied": f"{validation['discount']}%"
        }
    
    def _requires_manual_approval(self, draft: dict) -> bool:
        """Deterministic approval logic"""
        # High value orders
        if draft["value"] > 10000:
            return True
        
        # First-time customers
        if draft["customer_is_new"]:
            return True
        
        # Suspicious patterns (multiple promos same day)
        if draft["promo_count_today"] > 3:
            return True
        
        return False
    
    def _handle_no_code(self) -> dict:
        return {
            "status": "error",
            "message": "No promo code found. Please share your code (e.g., TUSKER50)",
            "next_action": "request_code"
        }
    
    def _handle_invalid_code(self, validation: dict) -> dict:
        return {
            "status": "error",
            "message": f"Code invalid: {validation['reason']}",
            "next_action": "verify_code"
        }
    
    def _handle_compliance_failure(self, compliance: dict) -> dict:
        return {
            "status": "error",
            "message": "Age verification required",
            "next_action": "request_id_verification",
            "reason": compliance["reason"]
        }
    
    def _handle_extraction_error(self, error: Exception) -> dict:
        log_error("extraction_failed", error)
        return {
            "status": "error",
            "message": "Unable to process message. Please try again.",
            "next_action": "retry"
        }
    
    def _handle_order_creation_error(self, error: Exception) -> dict:
        log_error("order_creation_failed", error)
        return {
            "status": "error",
            "message": "Order creation failed. Please contact support.",
            "next_action": "escalate_to_human"
        }
    
    def _log_successful_redemption(self, code: str, order_value: float, discount_applied: float):
        """Log for ROI tracking"""
        metrics.record({
            "event": "promo_redeemed",
            "code": code,
            "order_value": order_value,
            "discount_applied": discount_applied,
            "timestamp": datetime.now()
        })
```

**Notice what we did:**
- ✅ YOU control every step
- ✅ Clear error handling at each point
- ✅ Deterministic approval logic
- ✅ LLM only used for extraction
- ✅ Everything else is YOUR code

---

## Part 6: Evals - The Missing Piece

### Why Evals Are NOT QA Tests

**QA Tests (Traditional):**
```python
def test_validate_promo():
    result = validate_promo("TUSKER50")
    assert result["valid"] == True
    assert result["discount"] == 10
```
**This tests deterministic code. It's precise.**

**AI Evals (Different):**
```python
def eval_extraction():
    test_cases = [
        ("I have code TUSKER50", "TUSKER50"),
        ("Nina TUSKER50 hapa", "TUSKER50"),
        ("My promo is tusker50", "TUSKER50"),  # lowercase
        ("Use TUSKER50!", "TUSKER50"),  # punctuation
    ]
    
    scores = []
    for input_msg, expected_code in test_cases:
        result = extract_promo(input_msg)
        correct = result["code"] == expected_code
        scores.append(1 if correct else 0)
    
    accuracy = sum(scores) / len(scores)
    return accuracy  # 0.75 = 75% accuracy
```
**This tests probabilistic behavior. It's statistical.**

### The Three Types of Evals You Need

**1. Unit Evals (Test Individual LLM Calls)**

```python
# Eval: Does extraction work?
def eval_promo_extraction():
    test_cases = [
        # (input, expected_output)
        ("Code TUSKER50", {"code": "TUSKER50", "confidence": "high"}),
        ("I got tusker50", {"code": "TUSKER50", "confidence": "medium"}),
        ("Promo?", {"code": None, "confidence": "low"}),
    ]
    
    results = []
    for input_msg, expected in test_cases:
        actual = extract_promo(input_msg)
        
        # Check correctness
        code_match = actual["code"] == expected["code"]
        
        # Check confidence calibration
        confidence_match = actual["confidence"] == expected["confidence"]
        
        results.append({
            "input": input_msg,
            "expected": expected,
            "actual": actual,
            "code_correct": code_match,
            "confidence_correct": confidence_match
        })
    
    accuracy = sum(r["code_correct"] for r in results) / len(results)
    
    print(f"Extraction Accuracy: {accuracy*100}%")
    return results
```

**2. Integration Evals (Test Full Flows)**

```python
# Eval: Does the full redemption flow work?
def eval_redemption_flow():
    test_scenarios = [
        {
            "name": "Happy path",
            "input": "I have TUSKER50",
            "phone": "+254700123456",
            "expected_status": "success",
            "expected_discount": 10
        },
        {
            "name": "Invalid code",
            "input": "I have INVALID123",
            "phone": "+254700123456",
            "expected_status": "error",
            "expected_message_contains": "invalid"
        },
        {
            "name": "High value needs approval",
            "input": "I have PREMIUM100",
            "phone": "+254700123456",
            "expected_status": "pending_approval",
            "mock_order_value": 15000
        }
    ]
    
    results = []
    for scenario in test_scenarios:
        # Run full flow
        result = handle_redemption(
            scenario["input"],
            scenario["phone"]
        )
        
        # Check expectations
        status_match = result["status"] == scenario["expected_status"]
        
        passed = status_match
        # Add more checks based on scenario
        
        results.append({
            "scenario": scenario["name"],
            "passed": passed,
            "result": result
        })
    
    pass_rate = sum(r["passed"] for r in results) / len(results)
    print(f"Flow Pass Rate: {pass_rate*100}%")
    return results
```

**3. Production Evals (Test on Real Data)**

```python
# Eval: How are we doing in production?
def eval_production_performance():
    """
    Run on last 100 real conversations
    Measure: accuracy, hallucination rate, escalation rate
    """
    recent_conversations = db.get_recent_conversations(limit=100)
    
    metrics = {
        "total": len(recent_conversations),
        "successful": 0,
        "escalated": 0,
        "errors": 0,
        "hallucinations": 0
    }
    
    for conv in recent_conversations:
        if conv["status"] == "success":
            metrics["successful"] += 1
        elif conv["status"] == "escalated":
            metrics["escalated"] += 1
        elif conv["status"] == "error":
            metrics["errors"] += 1
        
        # Check for hallucinations
        if detect_hallucination(conv["response"], conv["context"]):
            metrics["hallucinations"] += 1
    
    metrics["success_rate"] = metrics["successful"] / metrics["total"]
    metrics["hallucination_rate"] = metrics["hallucinations"] / metrics["total"]
    
    print(f"Production Metrics:")
    print(f"  Success Rate: {metrics['success_rate']*100}%")
    print(f"  Hallucination Rate: {metrics['hallucination_rate']*100}%")
    
    # Alert if degraded
    if metrics["success_rate"] < 0.85:
        alert_team("Success rate dropped below 85%")
    
    return metrics
```

### LLM-as-Judge (Advanced Eval)

```python
# Use an LLM to evaluate another LLM's output
def eval_with_llm_judge(test_cases):
    """
    For subjective qualities: tone, helpfulness, accuracy
    """
    
    judge_prompt = """
    You are evaluating a customer service response.
    
    User message: {user_message}
    AI response: {ai_response}
    Expected behavior: {expected}
    
    Rate the response on:
    1. Accuracy (0-10): Does it contain correct information?
    2. Tone (0-10): Is it polite and professional?
    3. Helpfulness (0-10): Does it solve the user's problem?
    
    Return JSON only:
    {{
        "accuracy": 8,
        "tone": 9,
        "helpfulness": 7,
        "reasoning": "Response is accurate but could be more helpful..."
    }}
    """
    
    results = []
    for case in test_cases:
        ai_response = generate_response(case["user_message"])
        
        # Judge evaluates the response
        judgment = judge_llm.evaluate(
            judge_prompt.format(
                user_message=case["user_message"],
                ai_response=ai_response,
                expected=case["expected_behavior"]
            )
        )
        
        results.append({
            "case": case,
            "response": ai_response,
            "scores": judgment
        })
    
    # Aggregate scores
    avg_accuracy = sum(r["scores"]["accuracy"] for r in results) / len(results)
    avg_tone = sum(r["scores"]["tone"] for r in results) / len(results)
    
    return {
        "avg_accuracy": avg_accuracy,
        "avg_tone": avg_tone,
        "details": results
    }
```

### Continuous Eval Pipeline

```python
# Run evals automatically
def continuous_eval_pipeline():
    """
    Run evals on every deploy, daily, or on-demand
    """
    
    # Run all eval suites
    extraction_results = eval_promo_extraction()
    flow_results = eval_redemption_flow()
    production_results = eval_production_performance()
    
    # Aggregate
    report = {
        "timestamp": datetime.now(),
        "extraction_accuracy": extraction_results["accuracy"],
        "flow_pass_rate": flow_results["pass_rate"],
        "production_success_rate": production_results["success_rate"],
        "hallucination_rate": production_results["hallucination_rate"]
    }
    
    # Compare to baseline
    baseline = load_baseline_metrics()
    
    if report["extraction_accuracy"] < baseline["extraction_accuracy"] - 0.05:
        alert_team("Extraction accuracy degraded by 5%")
    
    if report["hallucination_rate"] > baseline["hallucination_rate"] + 0.02:
        alert_team("Hallucination rate increased by 2%")
    
    # Save results
    save_eval_results(report)
    
    return report

# Run on every deploy
def deploy():
    run_tests()  # Traditional QA
    eval_results = continuous_eval_pipeline()  # AI evals
    
    if eval_results["extraction_accuracy"] < 0.80:
        print("❌ Evals failed. Do not deploy.")
        exit(1)
    
    print("✅ Evals passed. Deploying...")
    deploy_to_production()
```

---

## Part 7: The Kenya-Specific Playbook

### Real Problems, Real Solutions

**1. M-Pesa Integration**

```python
# Promo codes must integrate with M-Pesa payments
def handle_mpesa_promo_flow(message, phone):
    # Extract promo
    extracted = extract_promo(message)
    validation = validate_promo(extracted["code"])
    
    # Calculate final price
    order_total = 5000  # Base price
    discount_amount = order_total * (validation["discount"] / 100)
    final_price = order_total - discount_amount
    
    # Initiate M-Pesa STK push
    mpesa_response = mpesa.stk_push(
        phone=phone,
        amount=final_price,
        reference=f"PROMO-{extracted['code']}"
    )
    
    return {
        "status": "payment_initiated",
        "original_price": order_total,
        "discount": discount_amount,
        "final_price": final_price,
        "mpesa_checkout_id": mpesa_response["checkout_id"]
    }
```

**2. Swahili/English Code-Switching**

```python
# Your LLM must handle mixed languages naturally
test_cases_kenya = [
    ("Nina code TUSKER50", "TUSKER50"),
    ("Nataka kutumia BEER20 kwa order yangu", "BEER20"),
    ("My promo ni PILSNER15", "PILSNER15"),
    ("Code yangu TUSKER50 iko expired?", "TUSKER50"),
]

# The extraction prompt needs examples
EXTRACTION_PROMPT_KENYA = """
Extract promo code from Kenyan customer message.
Handle Swahili/English mixing naturally.

Examples:
- "Nina code TUSKER50" → TUSKER50
- "Nataka BEER20" → BEER20
- "My code ni PILSNER15" → PILSNER15

User: {message}
Return JSON: {{"code": "CODE" or null}}
"""
```

**3. USSD Constraints**

```python
# USSD has character limits - responses must be tiny
def format_for_ussd(result: dict) -> str:
    """
    USSD max: 160 chars per message
    Must be ultra-concise
    """
    if result["status"] == "success":
        return f"CON Order KES {result['final_price']}\n1. Confirm\n2. Cancel"
    
    elif result["status"] == "error":
        # Compress error messages
        error_map = {
            "Code not found": "Code si sahihi",
            "Code expired": "Code imeisha",
            "Age verification required": "Uthibitisho unahitajika"
        }
        return f"END {error_map.get(result['message'], 'Kosa')}"
    
    elif result["status"] == "pending_approval":
        return "END Subiri dakika 5 kwa approval"
```

**4. Low-Bandwidth Optimization**

```python
# Kenya networks can be slow - optimize for speed
def optimize_for_kenya():
    """
    Strategies:
    1. Use fastest models (Gemini Flash over GPT-4)
    2. Compress context aggressively
    3. Cache common responses
    4. Async processing where possible
    """
    
    # Use fast model
    model = "gemini-2.0-flash-exp"  # Not GPT-4
    
    # Cache common extractions
    @cache(ttl=3600)
    def extract_promo(message):
        return llm.extract(message)
    
    # Async for non-blocking
    async def process_redemption(message):
        extracted = await async_extract(message)
        validation = await async_validate(extracted)
        return validation
```

**5. Compliance Tracking (Kenya Alcohol Laws)**

```python
# Must track for regulatory compliance
class ComplianceLogger:
    """
    Log everything for EABL, government audits
    """
    
    def log_redemption_attempt(self, data: dict):
        """
        Must log:
        - Customer age verification
        - Promo code used
        - Order value
        - Timestamp
        - Location (if available)
        """
        compliance_record = {
            "event": "promo_redemption_attempt",
            "timestamp": datetime.now(),
            "customer_phone": hash_pii(data["phone"]),  # Hash PII
            "age_verified": data["age_verification"]["status"],
            "promo_code": data["code"],
            "order_value": data["order_value"],
            "location": data.get("location"),
            "ip_address": data.get("ip"),
            "user_agent": data.get("user_agent"),
            "compliance_flags": self._check_flags(data)
        }
        
        # Store in append-only audit log
        audit_log.append(compliance_record)
        
        # Alert on suspicious patterns
        if self._is_suspicious(compliance_record):
            alert_compliance_team(compliance_record)
    
    def _check_flags(self, data: dict) -> list:
        flags = []
        
        # Under 21?
        if data["age_verification"]["age"] < 21:
            flags.append("underage_attempt")
        
        # Multiple promos same day?
        if self._count_redemptions_today(data["phone"]) > 3:
            flags.append("excessive_redemptions")
        
        # Suspicious location?
        if data.get("location") in RESTRICTED_ZONES:
            flags.append("restricted_zone")
        
        return flags
```

---

## Part 8: Measuring What Matters

### The North Star Metric

For your promo engine:

**ROI = Profit Generated / Promo Cost**

Target: **1.67x** (every KES 1 spent returns KES 1.67 profit)

```python
def calculate_promo_roi(promo_code: str, time_period: str = "30d"):
    """
    Calculate actual ROI for a promo campaign
    """
    redemptions = db.query("""
        SELECT 
            order_value,
            discount_applied,
            product_cost
        FROM redemptions
        WHERE promo_code = ?
        AND status = 'approved'
        AND timestamp > NOW() - INTERVAL ?
    """, (promo_code, time_period))
    
    total_revenue = sum(r["order_value"] for r in redemptions)
    total_discount = sum(r["discount_applied"] for r in redemptions)
    total_cost = sum(r["product_cost"] for r in redemptions)
    
    # Profit = Revenue - Cost - Discount
    profit = total_revenue - total_cost
    cost_of_promo = total_discount
    
    roi = profit / cost_of_promo if cost_of_promo > 0 else 0
    
    return {
        "promo_code": promo_code,
        "period": time_period,
        "redemptions": len(redemptions),
        "total_revenue": total_revenue,
        "total_discount": total_discount,
        "profit": profit,
        "roi": roi,
        "meets_target": roi >= 1.67,
        "recommendation": "scale" if roi >= 1.67 else "stop"
    }
```

### Dashboard for Distributors

```python
# What distributors need to see
def generate_distributor_dashboard():
    active_promos = db.get_active_promos()
    
    dashboard = {
        "summary": {
            "total_active_promos": len(active_promos),
            "total_redemptions_today": count_redemptions_today(),
            "revenue_today": sum_revenue_today(),
            "avg_roi": calculate_avg_roi()
        },
        "promos": []
    }
    
    for promo in active_promos:
        roi_data = calculate_promo_roi(promo["code"])
        
        dashboard["promos"].append({
            "code": promo["code"],
            "discount": promo["discount_percent"],
            "redemptions": roi_data["redemptions"],
            "revenue": roi_data["total_revenue"],
            "roi": roi_data["roi"],
            "status": "🟢 Scale" if roi_data["roi"] >= 1.67 else "🔴 Stop",
            "action": roi_data["recommendation"]
        })
    
    return dashboard

# Output:
# {
#   "summary": {
#     "total_active_promos": 5,
#     "total_redemptions_today": 47,
#     "revenue_today": 235000,
#     "avg_roi": 1.82
#   },
#   "promos": [
#     {
#       "code": "TUSKER50",
#       "discount": 10,
#       "redemptions": 67,
#       "revenue": 335000,
#       "roi": 1.89,
#       "status": "🟢 Scale",
#       "action": "scale"
#     },
#     {
#       "code": "PILSNER20",
#       "discount": 5,
#       "redemptions": 23,
#       "revenue": 115000,
#       "roi": 1.23,
#       "status": "🔴 Stop",
#       "action": "stop"
#     }
#   ]
# }
```

---

## Part 9: The Moral Framework

### Using AI Ethically

**Ask These Questions:**

1. **Does This Solve a Real Problem?**
   - ✅ YES: Money wasted on inefficient promos
   - ✅ YES: Compliance burden is real
   - ❌ NO: "AI-powered calendar" (nice-to-have)

2. **Is AI the Simplest Solution?**
   - ⚠️ For extraction: Maybe (regex could work)
   - ✅ For Swahili/English: Yes (NLU needed)
   - ✅ For conversational flow: Yes

3. **Am I Using the Smallest Model?**
   - ✅ Gemini Flash (not GPT-4)
   - ✅ Inference only (not training)
   - ✅ Caching where possible

4. **Does This Create Real Value?**
   - ✅ Saves distributor money
   - ✅ Improves compliance
   - ✅ Creates efficiency

5. **Am I Contributing to AI Waste?**
   - ✅ NO: Not creating content slop
   - ✅ NO: Not using AI for vanity metrics
   - ✅ NO: Replacing inefficient manual processes

**Score: 4.5/5 - You're good.**

### Efficiency Guidelines

```python
# 1. Use smallest model that works
model = "gemini-2.0-flash-exp"  # Not GPT-4

# 2. Compress context aggressively
context = get_last_n_messages(3)  # Not entire history

# 3. Cache common responses
@cache(ttl=3600)
def extract_promo(message):
    return llm.extract(message)

# 4. Use deterministic code where possible
if message == "hello":
    return "Hello!"  # Not llm.ask("say hello")

# 5. Measure and optimize
track_tokens_per_request()
alert_if_avg_tokens > threshold
```

---

## Part 10: Your Action Plan

### The 4-Week Build

**Week 1: Core Primitive**
- ONE tool call working
- Extract promo → validate → return result
- Goal: Understand LLM + tool pattern

**Week 2: Chain Tools**
- Extract → validate → create draft
- Add error handling
- Goal: Multi-step flows

**Week 3: Add HITL**
- High-value approval gate
- Human dashboard
- Goal: Pause/resume patterns

**Week 4: Orchestration**
- Explicit control flow
- State management
- Goal: Production-ready system

### Daily Micro-Goals

**Don't plan weeks. Ship daily.**

Day 1: `extract_promo()` works
Day 2: `validate_promo()` works
Day 3: Chain them together
Day 4: Add error handling
Day 5: Deploy to test server
Day 6: Get ONE real user to test
Day 7: Fix biggest bug

**Repeat.**

---

## Closing Thoughts

### The Core Principles

1. **LLMs are components, not systems**
2. **Deterministic code is 80% of the solution**
3. **Evals are NOT optional**
4. **Human escalation is a feature**
5. **Own your control flow**
6. **State management is critical**
7. **Small agents > mega agents**
8. **Measure everything**
9. **Ship scrappy, iterate fast**
10. **Build for real problems**

### The Pattern You'll Use Forever

```python
def agent_pattern(input):
    # 1. Extract structure (LLM)
    extracted = llm.extract(input)
    
    # 2. Validate (deterministic)
    if not validate(extracted):
        return error()
    
    # 3. Execute (deterministic)
    result = execute_action(extracted)
    
    # 4. Human gate if needed (deterministic threshold)
    if needs_human(result):
        return pause_for_human()
    
    # 5. Finalize (deterministic)
    return finalize(result)
```

**This pattern is:**
- Simple
- Testable
- Debuggable
- Scalable
- Production-ready

**Master this, and you master production AI.** BUSINESSES NEED TO Invest in outcomes, not tools.

---

## Your Manifesto

> "Planning feels like progress, but it's just a rehearsal that never ends.
> The plan becomes a fortress protecting me from risking anything at all.
> So burn the tenth revision, close the 5 tabs with *FIVE BETTER WAYS TO BEGIN* and let the messy doing win."

**This document is your playbook.**

**Now go build.**

**One function at a time.**
**One day at a time.**
**One real user at a time.**

**The data centers are running whether you use them or not.**
**Might as well solve a real problem.**

🚀 **FAIL FORWARD. BUILD FORWARD. SHIP FORWARD.** 🚀


WHAT TERMINAL BENCH TEACHES ME(LLM Native Dev):
How to write prompts that actually produce correct outcomes (task.yaml)
How to validate AI outputs systematically (test suites)
How to architect problems so LLMs can solve them (self-contained environments)
How to debug when AI fails (broken → fixed workflow)

// Define what "correct" looks like (evals)
// Build systems that produce consistent results
The FT doc is right:

"The gap between potential and actual realized gains is where 80% of businesses trip"

Why?

Leaders are allergic to risk → They don't know which skills matter
Training/capability gap → Most teams don't know how to eval AI properly
iPhone with calls/text only → They see surface features, miss the infrastructure

Gen Z advantage: You're native to this. You see the chaos as opportunity, not risk.
While business leaders worry about "can we trust AI?", you're learning:

How to make AI trustworthy (evals)
How to measure when it works (test harnesses)
How to iterate when it doesn't (your workflow)

Getting paid to learn:
Eval design (the most in-demand AI skill)
Prompt engineering at scale (task.yaml optimization)
System architecture for AI reliability (Docker + test harnesses)
How to make non-deterministic systems behave deterministically


🎯 What This Means for 25-Year-Old You
When you have capital and build SACCO/pharmacy/liquor store tools:
Bad approach: "Let me add AI features because it's trendy"
Your approach:

Build eval harnesses for invoice processing accuracy
Create test suites for inventory predictions
Design prompts that produce consistent M-Pesa integration outputs
Iterate based on failure modes you already understand

That's the difference between:

Tools that "use AI" (everyone)
Tools that reliably improve workflows (rare, valuable)

Terminal-Bench Today          AI Engineering Tomorrow
─────────────────────────────────────────────────────
Write task.yaml         →     Design eval frameworks
Build test suites       →     QA for AI outputs
Debug broken code       →     Fix AI failure modes
Oracle/Null validation  →     A/B test AI improvements
Docker environments     →     Deploy AI at scale
Iterate on feedback     →     Ship reliable AI products

Surface level: "How to write test cases"
Real level: How to make non-deterministic systems behave deterministically through evals

🔥 Real Example: SACCO Finance Audit
Without Evals (What Most People Do):
```py
# Slap AI on top, hope it works
def audit_transaction(transaction):
    prompt = "Is this transaction compliant?"
    response = llm.ask(prompt + str(transaction))
    return response  # 🤞 Hope it's right

# Result: "Well it works but not quite"
# - Sometimes flags valid transactions (false positive)
# - Sometimes misses fraud (false negative)
# - No way to measure improvement
# - Finance manager can't trust it
```

With Evals (What You're Learning):
```py
# Step 1: Define "correct" behavior (like task.yaml)
AUDIT_SPEC = """
A transaction is NON-COMPLIANT if:
1. Amount > member's loan limit
2. Payment to unregistered vendor
3. Missing mandatory approvals
4. Duplicate transaction within 24hrs

A transaction is COMPLIANT if:
1. Within loan limit
2. Registered vendor
3. Has required approvals
4. No duplicates
"""

# Step 2: Build test suite (like Terminal-Bench tests)
def build_audit_test_suite():
    test_cases = [
        {
            "name": "Valid transaction within limit",
            "transaction": {
                "amount": 5000,
                "vendor": "registered_vendor_123",
                "approvals": ["manager_A"],
                "timestamp": "2025-10-28T10:00"
            },
            "expected": "COMPLIANT",
            "reason": "All checks pass"
        },
        {
            "name": "Exceeds loan limit",
            "transaction": {
                "amount": 150000,  # Over limit
                "vendor": "registered_vendor_123",
                "approvals": ["manager_A"],
                "timestamp": "2025-10-28T10:00"
            },
            "expected": "NON_COMPLIANT",
            "reason": "Amount exceeds member loan limit"
        },
        {
            "name": "Unregistered vendor",
            "transaction": {
                "amount": 5000,
                "vendor": "unknown_vendor",  # Not registered
                "approvals": ["manager_A"],
                "timestamp": "2025-10-28T10:00"
            },
            "expected": "NON_COMPLIANT",
            "reason": "Vendor not in approved list"
        },
        {
            "name": "Missing approval",
            "transaction": {
                "amount": 50000,
                "vendor": "registered_vendor_123",
                "approvals": [],  # Missing
                "timestamp": "2025-10-28T10:00"
            },
            "expected": "NON_COMPLIANT",
            "reason": "High-value transaction requires approval"
        },
        {
            "name": "Duplicate transaction",
            "transaction": {
                "amount": 5000,
                "vendor": "registered_vendor_123",
                "approvals": ["manager_A"],
                "timestamp": "2025-10-28T10:00",
                "similar_transaction_24h_ago": True
            },
            "expected": "NON_COMPLIANT",
            "reason": "Potential duplicate"
        }
    ]
    return test_cases

# Step 3: Eval function (like Oracle/Null validation)
def eval_audit_system():
    test_cases = build_audit_test_suite()
    
    results = []
    for case in test_cases:
        # Run AI audit
        actual = audit_transaction_with_ai(case["transaction"])
        
        # Check correctness
        correct = actual["status"] == case["expected"]
        
        results.append({
            "test": case["name"],
            "expected": case["expected"],
            "actual": actual["status"],
            "correct": correct,
            "reason": actual["reason"]
        })
    
    # Calculate metrics
    accuracy = sum(r["correct"] for r in results) / len(results)
    
    # Break down by type
    false_positives = sum(
        1 for r in results 
        if r["expected"] == "COMPLIANT" and r["actual"] == "NON_COMPLIANT"
    )
    false_negatives = sum(
        1 for r in results
        if r["expected"] == "NON_COMPLIANT" and r["actual"] == "COMPLIANT"
    )
    
    return {
        "accuracy": accuracy,
        "false_positives": false_positives,
        "false_negatives": false_negatives,
        "details": results
    }

# Step 4: Iterate until reliable
def improve_audit_system():
    baseline = eval_audit_system()
    print(f"Baseline accuracy: {baseline['accuracy']*100}%")
    
    # Iterate on prompts, rules, etc.
    while baseline["accuracy"] < 0.95:  # Target 95%
        # Analyze failures
        failures = [r for r in baseline["details"] if not r["correct"]]
        
        # Improve system based on failures
        # - Refine prompts
        # - Add deterministic rules
        # - Improve context
        
        # Re-eval
        baseline = eval_audit_system()
        print(f"New accuracy: {baseline['accuracy']*100}%")
    
    return baseline
```

Now the finance manager can say:

"Accuracy: 95%"
"False positive rate: 2%"
"False negative rate: 3%"

Not "Well it works but not quite."

🎯 Why This Bridges Tacit Knowledge
Experienced managers have tacit knowledge = patterns they can't articulate:

"This transaction feels off but I can't explain why"

Your job as AI engineer:

Extract that tacit knowledge through examples
Codify it into evals/test cases
Measure how well AI matches their intuition
Iterate until AI captures their expertise

🧠 1. CFO (Finance / Strategy Leadership)

Tacit zone:

Reading market and boardroom psychology — when to push, when to conserve.

Interpreting the tone of an investor question beyond the words.

Knowing what not to say in negotiations.

Judging “healthy risk” from years of pattern recognition.

Why tacit: Models and dashboards show data — but judgment about timing and tone is intuition built through repeated exposure to decisions and consequences.

🍳 2. Chef / Cook

Tacit zone:

Knowing when a sauce is done by smell or viscosity, not recipe time.

Balancing flavor by instinct after years of tasting.

Flowing with kitchen rhythm and team energy.

Why tacit: Recipes are explicit; taste, timing, and texture judgment come only from immersion and sensory memory.

💼 3. Salesperson

Tacit zone:

Reading micro-expressions and vocal cues.

Knowing when a deal is real vs. smoke.

Pivoting mid-conversation based on vibe.

Calibrating energy to rapport and objection tone.

Why tacit: Sales scripts are explicit; timing and emotional calibration are tacit.

🤖 5. Building AI for Domain Verticals

Tacit zone:

Understanding how practitioners think, not just what they do.

Capturing patterns of intuition (via observation, transcripts, expert feedback loops).

Translating uncodified heuristics into prompt logic or reinforcement learning.

Why tacit: The most valuable domain AIs will absorb tacit structures — how top experts make micro-judgments that can’t be extracted from manuals.

🔑 Takeaway Mental Model

Tacit knowledge thrives wherever stakes + ambiguity + human nuance collide.
That’s most of real-world work.
If you can design systems (human or AI) that capture and compound tacit knowledge, you’re building leverage that scales exponentially — because tacit → explicit → automated is the holy chain of ROI.

Philosophy = Thinking ABOUT doing the thing instead of DOING the thing

======================
EDITS:
Watched https://fin.ai/fin3. The guy argues if you care about improving, you have to invest in the model layer they have built:
- fin-cx-retrieval model
- fin-cx-reranker model
- fin-cx-summary model
- fin-cx-escalation model
- fin-cx-feedback model
It makes sense. After serving millions of users e.g in fintech, you need to choose one pain point that the general LLMs cant solve and focus resources there. I think in areas where HIPAA/Compliance e.g Finance is needed, this is gonna be the way!!!!! But I should not let it make me stop the first layer of AI engineering

OTHERS DOING NATIVE MODELS: https://campfire.ai/blog/introducing-LAM-the-first-erp-native-ai-model-built-for-accounting
(Large Accounting Model). BUT THEY FIRST HAD TO HAVE DATA THAT IS NATIVE TO AI. THATS IT AT SCALE, AI ENGINEERS STILL HAVE IT.


ESSYNW: https://claude.ai/chat/68df785a-cc1d-43e6-ac28-fa90c4c99dcb

===============================
Week 1-8: Use general LLMs (Gemini Flash, Claude) + deterministic code
↓
Hit quality ceiling (~70-80% accuracy)
↓
Identify the ONE bottleneck (extraction? validation? routing?)
↓
Collect production data on that bottleneck
↓
Fine-tune small model on YOUR data for that ONE task
↓
Measure improvement with evals (3-stage like Intercom)
↓
Deploy if it beats general LLM

✅ Start with general LLMs (don't over-engineer)
✅ Let production usage reveal bottlenecks (data-driven)
✅ Build custom models for ONE specific task (not everything)
✅ Use 3-stage eval before deploying (offline → OOD → live)
✅ Continuous improvement from production data (flywheel)


=================
WHY SLOPS FAIL ACCORDING TO MIT:
40% → No clear strategy (building without knowing the problem)
30% → Poor data quality (garbage in, garbage out)
20% → Missing specialized skills (can't judge what AI produces)
10% → No executive backing

The leverage gap: Most companies are throwing AI at problems without understanding the problem. They're building features, not outcomes.
Winning way: outcome defined first (prevent losing campaigns), then AI/automation to deliver it.

Intercom Fin AI: Outcomes-Based Moat
The Proof:

51% average resolution rate (some customers hit 87%)
150% ROI for Road (cut inbox by 70%)
Fundrise: 50% automation, 95% accuracy
New metric: CX Score (AI-generated customer sentiment, no surveys needed)
What Intercom did right:

Measured outcomes, not features (resolution rate > "we have AI")
Priced on value (companies pay based on conversations resolved, not seats)
Pushed the moat upstream (from "we built a chatbot" to "we reduce support costs by 50%")

AI adds magic at decision points. Engineering creates reliability everywhere else.

> "Real production AI is 80% deterministic software engineering, 15% smart context management, 5% LLM calls at precise decision points."

