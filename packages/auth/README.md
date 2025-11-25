## How Auth Connects to Subscription & Pricing

Auth is critical for pricing model:
1. **Organization Context**: Auth determines which business entity a user belongs to
2. **RBAC**: Different subscription tiers get different features
3. **User Counting**: Distributors pay per user (2 included, additional on demand)
4. **Pricing Lock-In**: Auth session includes subscription metadata like `joined_date` and `locked_price_tier`
5. **Feature Flags**: Auth token carries which features are available (core vs outcome-based upsells)
6. **Metering**: Auth identifies who triggers billable events (conversations, promos sent)

Organization (Business Entity)
├── Subscription
│   ├── tier: "retail" | "wholesale" | "distributor"
│   ├── `base_price`: 200 | 250 | 500
│   ├── `joined_date`: "2025-11-17"
│   ├── `price_locked`: true
│   ├── `included_users`: 1 | 1 | 2
│   └── `outcome_pricing_active`: boolean
├── Users
│   ├── Owner (1 per org)
│   ├── Admin (manages users, sees billing)
│   └── Member (uses features)
└── Usage Metrics
    ├── `active_users_count`
    ├── `conversations_count` (for outcome pricing)
    └── `promos_sent_count` (for outcome pricing)

## Middleware layer (checks):
- Is user authenticated?
- Which org do they belong to?
- What's their subscription tier + `joined_date`?
- Are they within user limits? (critical for distributors)


## Extends:
- `/auth/check-user-limits` : For those hitting cap of base plan users


## Enforce Outcome-Based Billing
1. End-of-Month Invoice + Manual STK Push
```js
// 1. Track usage in real-time
async function recordUsageEvent(orgId, eventType) {
  await db.usage_events.insert({
    org_id: orgId,
    event_type: eventType, // 'conversation', 'promo_sent'
    created_at: new Date()
  });
  
  // Increment Redis counter for live dashboard
  await redis.incr(`usage:${orgId}:${eventType}:${getCurrentMonth()}`);
}

// 2. End of month: Calculate bill
async function generateMonthlyBill(orgId) {
  const org = await db.organizations.findOne({ id: orgId });
  const usage = await db.usage_events.count({
    where: {
      org_id: orgId,
      created_at: { gte: startOfMonth(), lte: endOfMonth() }
    },
    groupBy: 'event_type'
  });
  
  const baseFee = org.locked_base_price; // KES 200/250/500
  const outcomeFee = calculateOutcomePricing(usage); // Your logic
  
  return {
    base: baseFee,
    outcome: outcomeFee,
    total: baseFee + outcomeFee,
    dueDate: addDays(new Date(), 7) // 7 days to pay
  };
}

// 3. Send STK Push (M-Pesa prompt)
async function sendPaymentRequest(orgId, amount) {
  const org = await db.organizations.findOne({ id: orgId });
  
  // Use Intasend/Kopokopo wrapper
  const response = await mpesa.stkPush({
    phoneNumber: org.mpesa_phone,
    amount: amount,
    accountReference: `INV-${orgId}-${getCurrentMonth()}`,
    description: `LiquorApp ${getCurrentMonth()} Bill`
  });
  
  // Customer gets prompt on their phone to approve payment
  return response;
}
```

> They approve on phone: Payment confirms via callback → mark subscription active

2. Airtime top-up models + Micro-billing (Stick with Option 1 first)

```js
// Always show pending charges in real-time
app.get('/api/billing/current-month', async (req, res) => {
  const usage = await redis.mget(
    `usage:${req.org.id}:conversation:${getCurrentMonth()}`,
    `usage:${req.org.id}:promo_sent:${getCurrentMonth()}`
  );
  
  const estimatedBill = {
    base: req.org.locked_base_price,
    conversations: usage[0] * 5, // KES 5 per conversation
    promos: usage[1] * 2, // KES 2 per promo
    projected_total: req.org.locked_base_price + (usage[0] * 5) + (usage[1] * 2)
  };
  
  return res.json(estimatedBill);
});
```