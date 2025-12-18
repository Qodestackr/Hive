# Outcome-Based Pricing: A Framework for the AI Era

## The Thesis

When the cost to build software collapses, the moat cannot be "we built it and you cannot." Switching costs disappear when anyone can ship a decent product in weeks. The value must live somewhere else—upstream toward the actual outcome the customer cares about.

This is the fundamental shift: you are not selling seats, not selling features, not even selling access. You are selling results. Your incentives align with the customer's incentives. If you do not deliver, you do not eat.

The old model said: "We built something hard to build, so pay us for access."

The new model says: "We can prove we made you money, so pay us a share of that."

This framework unpacks how to architect outcome-based pricing from first principles, using Promco—a profit intelligence platform for Kenyan liquor distributors—as the working example. The principles generalize to any vertical software play in the AI era.

---

## Part One: The Micro-Economy Thesis

Forget the horizontal platform wars. The opportunity lies in micro-economies—small, specific markets where you can own the workflow, understand the pain deeply, and price on the outcome that workflow produces.

The checklist for identifying a viable micro-economy is tight. You need distinct operational workflows that are hard to copy without domain knowledge. You need expensive, recurring pain points where budget exists and urgency is real. You need regulatory complexity that creates an instant moat because newcomers cannot just move fast. You need standardizable processes so you can productize rather than consult. And you need a viable market size of roughly 100-500 customers paying well.

TAM does not need to be billions. It needs to be big enough to build a great business—say KES 50M-200M ARR is possible. It needs to be small enough that you can dominate without fighting SAP or Oracle. And it needs to be defensible enough that newcomers struggle because of compliance requirements, accumulated data, and embedded workflows.

The liquor distribution market in Kenya fits this profile precisely. Mid-tier distributors running 400-900 SKUs with KES 20M-80M annual revenue face a specific, expensive problem: they lose KES 100K-300K monthly on poorly planned promotions. The regulatory environment around alcohol sales—age verification, licensed venue tracking, KRA eTIMS integration—creates compliance moats that generic tools cannot address. The workflows are distinct but standardizable within the vertical. And the market is large enough to build real wealth but not so large that it attracts enterprise giants.

---

## Part Two: Why Domain Depth Beats Horizontal Scale

There is a temptation to think that once you solve a problem in one vertical, you should immediately expand horizontally. Build Promco for liquor, then adapt it to pharmacy, then to FMCG broadly. This instinct is wrong, and the AI era makes it more wrong, not less.

The reason is context. AI systems perform better with focused, domain-specific context than with diluted, generic knowledge. If Promco tried to adapt to pharmacy, you would need different compliance logic, different inventory patterns, different margin structures, and different customer workflows. Every adaptation dilutes the quality of your agentic integrations because those integrations are supposed to be intimate to a specific domain. Human problems are messy, and you will be torn trying to go deeper in multiple directions simultaneously.

The better approach is to use your credibility and experience to launch separate, domain-specific products. Keep Promco as it is for liquor distribution. Launch a healthcare-specific product—call it TajiCare—that melts the critical pain points pharmacies experience. Each product gets to be maximally intimate with its domain. Each product builds its own data moat. Each product can evolve its pricing based on the specific outcomes that matter in that vertical.

Vertical scaling is different from horizontal scaling. Within the liquor distribution vertical, there is natural expansion along the value chain. You start with distributors, but the same data infrastructure serves wholesalers and retailers. As your data compounds, you can move into adjacent value creation: B2B fintech (BNPL with lower risk than B2C because your transaction data provides underwriting signals), precision analytics for brand owners, spatial intelligence for territory optimization. A brand owner would pay for the insight that their distributor network is profitable because profitable distributors place more orders.

This is the leverage of vertical depth: each layer of the stack reinforces the others, and the data moat deepens with every transaction.

---

## Part Three: The Architecture of Outcome-Based Pricing

Outcome-based pricing requires more than a business decision—it requires architectural commitment. The data model must support attribution, measurement, and billing-grade immutability. Promco's schema demonstrates what this looks like in practice.

### Attribution Solved at the Data Layer

Every promo code carries `unitCostAtRedemption`, `actualProfit`, and `isProfitable` fields. This is not estimated profit or projected profit—it is actual profit calculated using FIFO inventory costs at the moment of redemption. When a customer redeems "Hennessy 20% off," the system knows which batch that bottle came from (oldest first, FIFO method), the exact unit cost at purchase time, and whether that specific redemption made or lost money.

This granularity matters because it makes your outcome claims auditable. You are not saying "we think we helped you." You are saying "here is the receipt showing exactly what we helped you earn."

### Billing-Grade Immutability

The `outcomeSnapshots` table freezes metrics at billing time: captures count, conversions, revenue, discount cost, profit, and campaign-level breakdown. Critically, it also freezes the pricing model that was active during that period. This creates an immutable audit trail. You can prove exactly what value you created in any billing period, and there can be no disputes about what pricing terms applied.

This immutability is what transforms outcome-based pricing from a promise into a contract. The customer can verify every charge against the frozen metrics. Trust compounds because the math is always visible.

### Pricing Version Grandfathering

The `pricingVersion` field on organizations, combined with locked `basePrice` and `outcomeProfitSharePercent` at signup, enables pricing evolution without betraying early adopters. You can experiment with pricing on new cohorts—raise the profit share percentage, adjust the capture fee, change the base structure—while honoring the terms that existing customers signed up for.

This is important because outcome-based pricing requires iteration. You will not get the percentages right on day one. You need the freedom to learn and adjust without creating churn from customers who feel bait-and-switched.

### The Capture-to-LTV Path

The `optInCampaignId` field on customers links every captured contact back to the campaign that acquired them. This enables you to attribute downstream value to the original capture. When you charge KES 100 for capturing a new verified customer in Month 1, and that customer generates KES 50,000 in trackable transactions over the next 12 months, you can prove the ROI of the capture fee.

However, there is a gap worth closing. The schema would benefit from a `customerLifetimeValue` or `attributedRevenue` field that accumulates over time per customer. This would allow easy queries like "what is the total value generated by customers captured in Campaign X?" Without this field, you can calculate the answer, but it requires joining across multiple tables and aggregating transaction history. With it, you have a single source of truth for proving long-term ROI from captures.

The query you want to answer effortlessly is: "Of the 200 customers captured in our January whisky campaign, what is their cumulative value through June?" That answer closes the loop on proving that capture fees are worth paying—and that your profit share percentage is fair relative to the value you helped create.

---

## Part Four: The Pricing Model in Detail

Promco's pricing model has three components that work together to align incentives while ensuring business sustainability.

### The Base Fee

A monthly base fee of KES 2,000-5,000 covers platform access. This is not about extracting value—it is about filtering out non-serious customers and covering marginal costs. Every customer you serve costs something: WhatsApp Business API fees, AI token costs for conversational commerce, cloud infrastructure, customer support overhead.

The math is straightforward. Ask yourself: what is the cost floor of serving even a low-activity customer? A distributor who runs four campaigns per month and sends 500 WhatsApp messages consumes real resources. If that costs you KES 1,500 in direct expenses, your base fee needs to be at least KES 2,000 to maintain positive unit economics on quiet months.

The base fee also signals commitment. A customer paying nothing has no skin in the game. A customer paying a small base fee has made a decision to take the platform seriously. This filters out tire-kickers and ensures your customer base consists of people who will actually use the tool and generate outcomes you can share in.

### The Capture Fee

KES 10 per new age-verified retail customer, KES 50 per new distributor contact. This monetizes the moment of customer acquisition—the instant when a phone number in a notebook becomes a verified, trackable, targetable profile in your system.

The capture ceiling is a real concern. A distributor serving 50 retailers does not have infinite new customers. After 6-12 months of active campaigns, you have digitized their entire network. Revenue from captures flatlines.

This is where the amortization mindset matters. The capture is not the value—it is the relationship data that capture unlocks. So you charge for the moment of capture, but you continue earning on what that relationship produces over time. Month 1 is the capture fee. Months 2-12 are profit share on what that customer generates through your system.

The capture fee is also perception management. Customer capture tools carry perceived value around digital presence—growing your WhatsApp list, building your database, enabling Instagram DM outreach. That perceived value is real and worth monetizing. But the deeper value is what happens after capture, which is why the capture fee is small relative to the profit share.

### The Profit Share

5% of campaign profit created. This is the core of outcome-based pricing. You only win when the customer wins.

The percentage requires careful calibration. Too low (1-2%) and you leave money on the table—you are creating significant value and barely participating in it. Too high (15-20%) and customers feel squeezed, start gaming the system, or look for alternatives. 5% sits in the zone where it is meaningful enough to build a business but modest enough that customers see you as aligned rather than extractive.

Consider the math from the customer's perspective. Before Promco, they ran four campaigns monthly and lost KES 150,000 (discovered weeks later in their books). After Promco, they run four campaigns monthly with pre-flight profit checks and make KES 350,000 profit. Promco's share is KES 17,500 (5% of profit) plus the base fee, call it KES 22,500 total. Their net gain is KES 327,500 monthly.

That is a 900% ROI. No rational customer churns from a product delivering 900% ROI. The 5% feels like a partnership, not a tax.

---

## Part Five: Building Trust in Outcome-Based Models

Trust in outcome-based pricing forms from three sources: transparency, skin in the game, and time.

### Transparency

The customer must be able to see the math, not just the result. Promco's pre-flight profit check embodies this. Before a campaign launches, the system shows:

```
🚨 PROFIT WARNING
"20% off Hennessy XO"
Current FIFO cost: KES 9,200/bottle
Selling price after discount: KES 8,800
Loss per redemption: -KES 400

💡 SMART SUGGESTION
Try 10% off instead → +KES 700 profit/bottle
Or push Jameson (slow mover, 45% margin)
```

You are not hiding behind "just run more campaigns and trust us." You are saying "this specific campaign will hurt you, here is the math, do not do it." That builds trust because you are visibly putting their interest ahead of your short-term revenue. A losing campaign generates no profit share for you, so you are incentivized to prevent it—and the customer can see that alignment.

### Skin in the Game

You lose if they lose. This is the fundamental promise of outcome-based pricing. When your revenue depends on their profit, you cannot succeed by shipping features that look good but do not work. You cannot succeed by driving engagement metrics that do not translate to outcomes. You must actually deliver results.

The profit share mechanism creates this automatically. If a campaign loses money, there is no profit to share. Your revenue from that campaign is zero. This is not a marketing message—it is a structural reality that customers can verify in the billing.

### Time

You stuck around when a campaign flopped and helped them fix it. Trust compounds over time as customers see you consistently deliver on the promise. The first month, they are skeptical. By month six, they have seen you prevent three losing campaigns and optimize five profitable ones. By month twelve, you are embedded in their decision-making process.

This is why the base fee matters for sustainability. Outcome-based pure plays are volatile—if a customer has a quiet month, your revenue drops. The base fee provides floor revenue that keeps you operational through variance, so you can be there in month twelve when the trust has fully compounded.

---

## Part Six: Value Capture in the AI Era

The question haunting every software builder is this: in the AI era, how much of the value you create can you actually capture back?

The tension is real. AI compresses the cost of building, which means competitors can replicate features fast. But AI also enables outcome measurement at a level that was impossible before. You can now track, attribute, and prove value in real-time. That is your leverage.

The old defensibility was code. "We built something technically hard, so pay us for access." That moat is eroding. A competent team with modern AI tools can clone most software functionality in weeks.

The new defensibility is data loops and domain expertise. Promco's moat is not the dashboard—it is the FIFO cost tracking tied to Kenyan distributor workflows, the compliance layer built for alcohol regulations, the WhatsApp-native delivery matching how business actually happens in this market. A competitor can clone the UI. They cannot clone 18 months of campaign profitability data that trains your recommendations.

This is why outcome-based pricing actually increases your value capture in the AI era. You can justify your fee with receipts. "We took 5% of KES 350K profit we helped create" is an easy yes. "Pay us KES 35K/month for software" is a harder sell when alternatives exist.

The 20/80 axiom applies here with force: 20% of your product drives 80% of willingness to pay. In the AI era, your MVP is not the Minimum Viable Product—it is the Most Valuable Product. This prevents the trap of trying to balance market share versus wallet share by underpricing. Market is those who can afford your value. Bring value and let those who can buy it buy it. Otherwise, you flip the axiom by underpricing, making customers expect more for less, thinking that if you ship the other 80% of features it will work—but only that original 20% will keep driving willingness to pay.

---

## Part Seven: The Evolution Path

Outcome-based pricing is not static. As your product matures and your data compounds, the model should evolve.

### Phase One: Prove Value Exists

Start with pure outcome-based pricing or heavy outcome weighting. In pilot phases, consider charging only on outcomes to prove that value exists. This is aggressive but it filters signal from noise fast. Customers who see real ROI will stay and expand. Customers who do not engage properly will churn—and that is information about product-market fit, not a failure.

The risk is that you absorb all the downside during the proving period. Mitigate this by keeping pilots short (30-60 days) and requiring meaningful engagement thresholds. A customer who signs up and never launches a campaign is not a valid test of your value proposition.

### Phase Two: Introduce the Hybrid

Once value is proven, introduce the hybrid model: base fee plus outcome share. The base fee covers your costs and filters for seriousness. The outcome share maintains alignment. This is the steady-state model for most customers.

The base fee also solves the "joker" problem. Without it, a customer could sign up, consume WhatsApp API costs and AI tokens, run campaigns that lose money (generating no profit share), and cost you more than they pay. The base fee ensures that even worst-case customers contribute to covering their marginal cost of service.

### Phase Three: Expand the Value Stack

As your data compounds, your recommendations get better. This creates room for a second tier: not just "we prevent bad promos" but "we design high-profit promos for you." You move from defensive (stop losses) to offensive (create wins).

This progression could manifest as an AI promo designer that analyzes your inventory, identifies slow movers with healthy margins, segments your customer base by purchase history, and generates campaign concepts optimized for profitability. That is higher value, higher trust, and justifies a higher capture rate—perhaps 7-8% profit share instead of 5%.

The key is that each tier represents genuinely more value, not just more features. Customers upgrade because the ROI math improves, not because you have gated functionality they need.

### Phase Four: Vertical Integration

With enough transaction data flowing through your system, you can expand into adjacent value creation. B2B BNPL becomes possible because you have underwriting signals from transaction history—distributors with consistent profitable campaigns are lower credit risks. Precision analytics for brand owners become valuable because you have visibility into what actually moves product versus what sits on shelves. Spatial intelligence emerges from aggregated data across your distributor network.

Each expansion deepens the moat. A competitor trying to enter must not only replicate your current product but also recreate years of accumulated data and the insights it enables.

---

## Part Eight: What You Are Not Paid To Build

The flip side of knowing what creates value is knowing what does not. In the AI era, certain capabilities have become commoditized to the point where building them yourself creates no competitive advantage.

Enterprise authentication is handled by Clerk, Auth0, and similar services. Observability is handled by Sentry, Datadog, and their peers. Payment processing is handled by M-Pesa integrations and payment orchestrators. Email delivery is handled by Resend, SendGrid, and others. These are table stakes. Customers expect them to work, but they do not pay premiums for them.

What customers pay for is the domain logic and the outcomes it enables. Promco's pre-flight profit check is not available from generic tools. The FIFO cost tracking tied to promotional campaigns is not available from generic tools. The compliance layer for Kenyan alcohol regulations is not available from generic tools. That is where your pricing power lives.

There is a subtler version of this principle that applies to onboarding and activation. Promco demonstrates this with its master catalog approach. Because the product is vertical-specific, you know that a bottle of Tusker is the same across all distributors, as is a 250ML Captain Morgan. By pre-loading 1,200+ SKUs into a master catalog and letting new customers simply activate what they sell, onboarding drops from hours to minutes.

This is not something you charge for—it is something that removes friction from getting to the things you do charge for. The customer does not pay for the master catalog. The customer pays for the profit intelligence that becomes available once their catalog is active. But without the frictionless onboarding, many customers would never reach the value that justifies payment.

Similarly, the AI integration becomes smarter from day one when context is constrained. A domain-specific AI that understands liquor distribution terminology, common promotions, and regulatory requirements outperforms a generic AI that must learn everything from scratch. Customers do not pay for "AI-powered"—they pay for recommendations that are actually good. Domain specificity is what makes the recommendations good.

---

## Part Nine: Comparison With Alternatives

Understanding outcome-based pricing requires contrasting it with alternatives customers might consider.

| Dimension | Promco (Outcome-Based) | Traditional POS Systems | Excel/Manual Tracking |
|-----------|------------------------|------------------------|----------------------|
| FIFO cost tracking | Automatic, per-redemption | Manual, if at all | Not feasible at scale |
| Pre-flight profit check | Before every campaign launch | Not available | Not available |
| Age verification | Built-in, compliant | Manual process | Manual process |
| WhatsApp campaigns | Integrated, trackable | Separate tool required | Separate tool required |
| Pricing model | Pay on profit created | Upfront license fee | Free but limited |
| Alignment | Vendor wins when you win | Vendor wins regardless | No vendor |
| Attribution | Auditable to redemption level | Aggregate at best | Impossible |

The traditional POS system charges upfront regardless of whether you succeed. It records what happened but does not help you decide what should happen. You pay for access to a tool, not for outcomes the tool creates.

Excel and manual tracking are free in direct costs but expensive in time and error rates. They cannot scale to real-time profit checking. They cannot integrate with WhatsApp for campaign delivery. They cannot maintain compliance audit trails.

Outcome-based pricing offers a different value proposition: we only get paid when we make you money, and we can prove exactly how much money we made you. For customers who have been burned by software that promised results and delivered invoices, this alignment is compelling.

---

## Part Ten: Market Opportunity Assessment

Promco operates in a specific market context that illustrates how to evaluate micro-economy opportunities for outcome-based pricing.

| Factor | Assessment | Rationale |
|--------|------------|-----------|
| Problem Severity | High | Distributors lose KES 100K-300K monthly on poorly planned promos—confirmed, recurring pain |
| Market Size | Sufficient | KES 150B+ liquor market in Kenya, expandable to broader FMCG |
| Willingness to Pay | Moderate-High | Outcome-based reduces friction versus upfront fees; trust is the barrier, not budget |
| Competitive Moat | Strong | FIFO profit intelligence is defensible; compliance layer is hard to replicate; data compounds |
| Timing | Favorable | New alcohol regulations create urgency; WhatsApp Business adoption is mainstream |
| Execution Risk | Present | Requires distributor behavior change; integration with existing workflows must be seamless |

The opportunity scores well on the dimensions that matter for outcome-based pricing: measurable outcomes (profit per campaign), recurring value creation (monthly campaigns), and defensible differentiation (domain-specific intelligence that generic tools cannot match).

---

## Conclusion: The Mindset Shift

Outcome-based pricing is not a pricing strategy—it is a product philosophy. It requires building attribution into your data model from day one. It requires transparency that lets customers verify every charge. It requires genuine alignment where you lose when they lose. It requires domain depth that creates value generic tools cannot match.

The AI era makes this philosophy more viable, not less. Building software is cheaper, so access to software is less valuable. But measuring outcomes is more powerful than ever, so proving value creation is more viable than ever. The companies that thrive will be those that can say, with receipts, "here is exactly what we made you."

Promco embodies this philosophy. The profit check before campaign launch. The FIFO tracking at redemption. The outcome snapshots that freeze billing-grade metrics. The capture-to-LTV attribution that proves long-term value. Every architectural decision supports the core promise: we only win when you win, and we can prove it.

For builders evaluating where to place their bets, the framework is clear. Find a micro-economy with distinct workflows, expensive recurring pain, regulatory complexity, and standardizable processes. Build domain-specific tools that create measurable outcomes. Price on those outcomes. Let your data compound into a moat that competitors cannot cross.

The future belongs to those who sell results, not software.

---

## Appendix: The Incentive Alignment Test

Before committing to outcome-based pricing in any market, ask a harder question than "can I measure outcomes?" Ask: **does the buyer actually want the outcome I'm optimizing for?**

This sounds obvious until you encounter markets where stated goals and actual goals diverge. Consider insurance: a policyholder wants fast claim resolution. An insurer's profit model often benefits from slow resolution or claim denial. If you build a "faster claims processing" tool and try to sell it on outcomes (claims resolved per day), you may find no buyers—not because the tool doesn't work, but because faster claims means more money paid out. The buyer's *actual* incentive is claim denial, not claim resolution. Their innovation theater (mobile apps, accessibility messaging) masks an operational reality that resists the value you want to create.

> Same can be said in Healthcare VBC models where providers will likely want to avoid high risk patients, which beats the purpose coz they are the one who actually need care the most.

Promco passes this test cleanly. The distributor wants more profit per campaign. Promco charges a share of that profit. There is no divergence between stated and actual goals. When you prevent a losing campaign, the distributor keeps money they would have lost, and they can verify that in their books. The incentive alignment is structural, not rhetorical.

Before entering any market with outcome-based pricing, map the incentive structure:

- Who pays you? What do they *say* they want?
- What does their current behavior reveal about what they *actually* want?
- Does your outcome metric align with their actual incentive, or just their stated one?
- If you succeed wildly at delivering your outcome, does the buyer benefit or suffer?

If the answers reveal divergence, you have two choices: find a different buyer in the value chain whose incentives do align, or find a different market entirely. Do not attempt to sell outcome-based value into a buyer whose business model depends on that outcome *not* being achieved.

---

## Appendix: The AI Cost Paradox

If you build AI-powered tools and price on usage tiers (messages per month, tokens consumed, API calls), you become a middleman with margin compression risk. Your cost scales with usage. Your revenue scales with usage. You're exposed to AI provider pricing changes, and you have no incentive to make the AI more efficient—only to upsell higher tiers.

Outcome-based pricing inverts this. You absorb the AI cost. You charge on results. Now you're incentivized to make the AI actually work, because bad AI that burns tokens without producing outcomes eats your margin. Good AI that produces outcomes efficiently improves your margin.

This creates a forcing function for quality. You cannot ship an AI that hits 70% accuracy and call it done, because that last 30% is where outcomes live or die. You must iterate until the AI genuinely delivers value, not just generates activity.

The architectural implication: build deterministic-first with AI sprinkled in. Use deterministic systems for everything that *must* work—billing calculations, compliance checks, FIFO cost attribution, audit trails. Use AI for what it excels at—natural language interfaces, pattern recognition, recommendation generation, conversational commerce. The AI enhances the deterministic core; it does not replace it.

Most AI agents collapse at 70-80% functionality because builders over-index on AI capabilities and under-index on domain logic. The builder leverage has shifted upward, not downward. You still need deep domain expertise to build systems that work. AI makes the ceiling higher, not the floor lower.

When you price on outcomes, you feel this truth in your revenue. Ship a tool that works 70% of the time, and you capture 70% of potential value—or less, because customers churn when the tool fails at critical moments. Ship a tool that works 95% of the time with graceful fallbacks for the other 5%, and you capture nearly full value while building trust that compounds.

The AI era rewards outcome-based pricing because it rewards builders who take responsibility for results. Absorb the cost. Deliver the value. Charge for what you create. That's the game now.

---

## Appendix: Speaking the Strategy

Outcome-based pricing is not just a business model—it changes how you talk to customers. The pitch cannot be about features or access. It must be about the outcome, spoken in their language, using their numbers, leading them to see the problem themselves.

### The Customer Conversation

When you explain Promco to a distributor, you are not selling software. You are asking: **"Do you know if you're making or losing money on each promo?"**

Here is what that looks like:

```
YOU: "Wewe, let me ask you something. When you run 
      a promo—like 20% off Hennessy—do you know 
      if you're making or losing money?"

THEM: "Uhhh... I mean, I know the discount, so..."

YOU: "But do you know what that bottle actually 
      COST you when you bought it?"

THEM: "Well, yeah, around 8,500 I think..."

YOU: "Okay. So if you're selling at 11,000, and you 
      give 20% off, that's 8,800 after discount. 
      You just lost 300 bob per bottle."

THEM: "Shit. I didn't think about it like that."

YOU: "That's what we fix. Before you launch ANY promo, 
      we tell you: profitable or not. That's it."

THEM: "How much?"
```

Notice what you did NOT say:
- No mention of FIFO, inventory movements, Saleor integrations
- No talk of "profit intelligence platforms" or "compliance layers"
- No abstract value propositions

You led with **their pain**, used **their numbers**, and let **them realize** the problem.

### The Playbook

**1. Lead with Pain, Not Features**

The opening question is not "Would you like better promo tools?" It is "Are you losing money on promos right now?"

Pain must be visceral and immediate:
- "How many hours did you spend last week chasing inventory numbers?"
- "What did that last stock-out cost you in lost sales?"
- "Have you ever run a promo that felt successful but the books showed a loss?"

If they do not feel the pain, stop selling. You cannot convince someone their leg is broken if they are walking fine.

**2. Use Their Actual Numbers**

Not abstract examples. Not case studies from other merchants. **Their products, their costs, their selling prices.**

When you calculate the loss on their Hennessy promo using their actual purchase cost and their actual discount percentage, it becomes real. They see themselves in the math. Abstract examples are ignorable. Their own numbers are not.

**3. Let Them Convince Themselves**

People believe what they discover more than what they are told.

You do not say "You're doing promos wrong." You ask questions until **they** say "Shit, I'm losing money."

The pivot moment is not when you explain the solution. It is when they realize the problem exists. Once they see it, the solution sells itself.

**4. Do Not Explain the How (Yet)**

When they ask "How does it work?", resist the urge to explain FIFO cost tracking, Drizzle ORM schemas, and API webhooks.

Say: "We track what each product cost you when you bought it. When you plan a promo, we calculate: profitable or not. That's it."

They will ask follow-up questions if they are interested. Lead them there. Do not dump.

### What Makes This Different

Traditional software pitches say: "Here are the features. Here is the price. Buy access."

Outcome-based pricing says: "Here is the money you are losing. Here is proof we can stop the loss. Pay us a share of what we save you."

The conversation structure changes:
- Traditional: **Feature → Benefit → Price → Close**
- Outcome-based: **Pain → Proof → Outcome → Revenue Share**

The customer is not buying software. They are buying **the end of a specific pain** and paying only when that pain actually ends.

### Why This Works in Kenya's Liquor Market

Mid-tier distributors run 4-8 campaigns per month. Many are losing money on poorly planned promos. But they do not **know** they are losing money until weeks later when the books close.

When you show them the math **before** the campaign launches, using **their** stock costs and **their** discount rates, you are not pitching a product. You are showing them a hemorrhage they did not know existed.

The outcome-based pricing model reinforces this: "We only charge if we actually prevent the loss."

That alignment is structural, not rhetorical. And the customer can verify it in real-time.

The goal is to focus on building things that create financial outcomes for customers, then capturing a share of those outcomes.

<!--Master sales, build fast, own your costs, measure outcomes ruthlessly, never run out of cash.-->