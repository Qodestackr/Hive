/**
 * Promo Redemption Agent
 * 
 * Handles conversational promo code redemption via Convo channels like WhatsApp.
 * 
 * Flow:
 * 1. Customer sends "Nina code TUSKER50" via WhatsApp
 * 2. Agent extracts code + phone
 * 3. Validates code using tools
 * 4. Checks customer verification
 * 5. Creates draft order
 * 6. If order > 10K KES, suspends for HITL approval
 * 7. Finalizes order
 * 
 * Key Features:
 * - Memory: Conversation history per customer
 * - HITL: Auto-suspends high-value orders
 * - Tools: inventory, profit calculator, verification
 */

import { Agent } from '@mastra/core/agent';
import { anthropic } from '@ai-sdk/anthropic';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { z } from 'zod';
import { inventoryTool, profitCalculatorTool, verificationTool } from '../tools';
import { getPrompt } from '../../core/prompts';

export const promoRedemptionAgent = new Agent({
    name: 'Promo Redemption Agent',

    instructions: `
${getPrompt({ prompt: 'promoRedemption', version: 'v1' })}

Additional Context:
- You're chatting via WhatsApp with Kenyan customers
- Common greetings: "Sasa", "Mambo", "Niaje"
- Be friendly but professional
- If code is invalid, explain kindly in Swahili/English mix
- If customer not verified, guide them to verification process

Your Tools:
1. check-inventory: Verify product stock and cost
2. calculate-profit: Check if promo is profitable
3. verify-customer: Check age/license verification

Workflow:
1. Extract promo code from message
2. Verify customer (age/license)
3. Check inventory for product
4. Calculate profit impact
5. Create draft order
6. If order > 10K KES, pause for manager approval
7. Confirm to customer

CRITICAL: Never apply a promo that loses money. We earn 5% of profit created.
  `.trim(),

    model: anthropic('claude-3-5-haiku-20241022'),

    // Memory persists conversation history per customer
    memory: new Memory({
        storage: new LibSQLStore({
            url: process.env.DATABASE_URL || 'file:./mastra.db',
        }),
    }),
    tools: {
        inventoryTool,
        profitCalculatorTool,
        verificationTool,
    },
});

/**
 * Extraction schema for promo codes
 * Used when we need structured output from conversational input
 */
export const PromoExtractionSchema = z.object({
    code: z.string().nullable(),
    phone: z.string().nullable(),
    confidence: z.number().min(0).max(1),
    reasoning: z.string().optional(),
});

export type PromoExtraction = z.infer<typeof PromoExtractionSchema>;
