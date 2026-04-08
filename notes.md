Before: Write custom GraphQL queries to check stock
After: AI assistant uses MCP to read stock, you focus on profit logic

I need to set aside time and ask AI esp ChatGPT deep research the following questions.

---------------
TODAY, WE WILL FOCUS ON SALEOR COMMERCE ENGINE. I AM USING IT FOR FMCG PROFIT INTELLIGENCE ENGINE(PROMOTIONS STARTING WITH KENYAN LIQOUR DISTRIBUTORS).

CURRENT MVP IS WRITTEN IN SALEOR CODE(CUSTOM GRAPHQL + WEBHOOKS AND SAAS MAPPING) AND TYPESCRIPT(TS-EFFECT, OTEL, DRIZZLE ORM, NEXTJS API ROUTES AND BETTERAUTH). WE ARE USING/IMPLEMENTING A CONVERSATIONAL COMMERCE WHERE AI AGENTS NEGOTIATE DYNAMIC PROMOTIONS.

Critical Constraints:
- Profit Guardrails: A custom FIFO inventory engine runs parallel to Saleor, tracking exact unit costs to block margin-negative promos before they are offered.
p AI Workflow: AI creates Saleor Draft Orders from chat, but only if the calculated "Actual Profit" is positive.
- Architecture: Strict "Error as Data"(ts-effect magic) patterns using Drizzle/Postgres to handle high-concurrency redemption logic(dont mind am a snr dev let us focus on business and taming complexity chaos)


I want us to check:
1. Saleor MCP - What does it save us from? In the past I would have to do many things
2. How do we extend Saleor MCP for mutations?
3. If Saleor MCP is currently read only, what does that mean? I hear them say we should never trust webhooks in prod and for obvious reasons, when a webhook arrives what do snr teams used to chaos mostly do? One of them is likely check to read the data and so on eh? Can we use MCP for that, the read only that they have?
4. I am not willing to let AI do many things. The only thing it can be allowed to do is make promos(pushing codes created from my system to Saleor) and draft orders with HITL steps. Creating orders directly could mess with books, draft orders signal intent to buy and when they dont convert, they serve as analytics
5. My code will be fragmented. Do I still need webhooks? Saleor MCP is written in FastMCP which is very native to FastAPI. I love FastAPI and TS, should I move my AI Agent layer and make MCP microservices instead and extend the MCP thing they have to the point TS so i only call the client in my CRUD layer? TS has unmatched DX btw
---------------
