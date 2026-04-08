/**
 * Mastra Configuration for Promco
 * 
 * Integrates with existing PostgreSQL (via Drizzle) and Effect patterns.
 * Focuses on: HITL workflows, memory, observability, evals.
 */

import { Mastra } from '@mastra/core';
import { LibSQLStore } from '@mastra/libsql';
import { promoRedemptionAgent } from './mastra/agents/promo-redemption.agent';
import { billingInsightAgent } from './mastra/agents/billing-insight.agent';
import { promoRedemptionWorkflow } from './mastra/workflows/promo-redemption.workflow';

/**
 * Main Mastra instance
 * 
 * This is the core configuration that wires up:
 * - Agents (promo redemption, back-in-stock, campaign health)
 * - Workflows (with HITL capability)
 * - Storage (for workflow state persistence)
 */
export const mastra = new Mastra({
    // Agents: AI entities that reason and use tools
    agents: {
        promoRedemptionAgent,
        billingInsightAgent
    },

    // Workflows: Deterministic multi-step processes with HITL capability
    workflows: {
        promoRedemptionWorkflow,
    },

    // Storage: Persists workflow state for suspend/resume
    storage: new LibSQLStore({
        url: process.env.DATABASE_URL || 'file:./mastra.db',
    }),

    // TODO: Add proper observability with Mastra.setLogger()
    // For now, using console.log in workflow steps
});

export default mastra;
