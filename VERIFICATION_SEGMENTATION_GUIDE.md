# Verification & Segmentation System

## Overview

**Customer verification + behavioral segmentation for promo targeting**

### B2C (Consumers)
- ✅ Age verification (18+ for alcohol)
- ✅ Behavioral filters (order patterns, timing, AOV)
- "Send to those who order at similar times of month"

### B2B (Businesses)
- ✅ License validation
- "Licenses keep them locked in" - only licensed businesses can order

## Architecture

```
┌─────────────────────────────────────────┐
│   Agent wants to send promo              │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│   customerVerificationTool.execute()     │
│   ├─ B2C: Check age verified            │
│   └─ B2B: Check license valid           │
└────────────┬────────────────────────────┘
             │
             ▼
     ┌───────┴───────┐
     │               │
     ▼               ▼
   ✅ OK          ❌ NOT OK
     │               │
     │               ▼
     │   Send deterministic message:
     │   "Age verification required..."
     │
     ▼
  Send promo
```

## Deterministic Messaging

**NO AI randomness** - same input = same output (100%)

```typescript
// Generate deterministic message
const message = DeterministicMessageGenerator.generate(
  'LOYALTY_OPTIN'
);
// Result: "You have been opted into our loyalty perks"

// AI can reference this message later
// "What did you send me earlier?"
// → AI checks conversation history, sees exact message
```

### Available Messages

| Type | Example |
|------|---------|
| `LOYALTY_OPTIN` | "You have been opted into our loyalty perks" |
| `AGE_VERIFICATION_REQUIRED` | "To continue, verify you are 18+..." |
| `LICENSE_VERIFICATION_REQUIRED` | "Your license has expired..." |
| `PROMO_AVAILABLE` | "New offer! Use code TUSKER50 for 20% off" |
| `ORDER_CONFIRMED` | "Order ORD-123 confirmed. Total: KES 5,000" |

## Segmentation Filters

### Behavioral
- **ordersAtSimilarTimes**: Customers who order same time each month (e.g., payday)
- **averageOrderValue**: Filter by spending range
- **orderFrequency**: weekly, monthly, quarterly

### Verification Status
- **ageVerified**: Only verified 18+ customers
- **hasValidLicense**: Only licensed businesses

## Usage in Agent

```typescript
// Before sending promo, verify customer
const verification = await customerVerificationTool.execute({
  customerId: phone,
  customerType: 'B2C'
});

if (!verification.canReceivePromo) {
  // Send deterministic verification request
  return DeterministicMessageGenerator.generate('AGE_VERIFICATION_REQUIRED');
}

// OK to send promo
```

## Files Created

1. **[`verification.tool.ts`](file:///home/qodestackrd/Desktop/promco/packages/ai/src/tools/verification.tool.ts)** - Core service
2. **[`customer-verification-ai.tool.ts`](file:///home/qodestackrd/Desktop/promco/packages/ai/src/tools/customer-verification-ai.tool.ts)** - AI wrapper

## Next: Wire to Database

Current status: **Mocked data**

To go live:
1. ☐ Create `customer_verifications` table (age, ID number, verified_at)
2. ☐ Create `business_licenses` table (license_number, type, expiry)
3. ☐ Wire up in `verification.tool.ts`
4. ☐ Add to `PromoRedemptionAgent` (already integrated!)

## Testing

```bash
# Test verification
curl -X POST http://localhost:3000/api/v1/ai/chat/message \
  -d '{"text": "Nina code TUSKER50", "userId": "254722123456"}'

# Should return: "Age verification required..." (if not verified)
```
