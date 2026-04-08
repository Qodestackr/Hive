/**
 * Mastra Tools - Inventory & Profit
 * 
 * Wraps existing Effect-based services as Mastra tools.
 * These are the "Sources of Truth" for AI agents.
 */

import { createTool } from '@mastra/core';
import { z } from 'zod';
import { fifoService, productService, ProfitCalculator } from '@repo/services';
import { effectToToolExecutor } from '../lib/effect-bridge';
import { Effect } from 'effect';
import { OrganizationContext } from '@repo/utils';

/**
 * Inventory Tool
 * 
 * THE SOURCE OF TRUTH for stock levels and FIFO costs.
 * Agents MUST call this before making any inventory claims.
 */
export const inventoryTool = createTool({
    id: 'check-inventory',
    description: `
Check real-time inventory levels and FIFO costs for a product.
Returns:
- Current stock quantity
- FIFO cost per unit (what the product actually cost to buy)
- Base selling price
- Batch information
- Stock status

USE THIS to verify stock before proposing any promo.
NEVER hallucinate inventory - always call this tool first.
  `.trim(),

    inputSchema: z.object({
        productId: z.string().describe('Product ID to check'),
        organizationId: z.string().describe('Organization/distributor ID'),
    }),

    outputSchema: z.object({
        productId: z.string(),
        productName: z.string(),
        currentStock: z.number(),
        currentFifoCost: z.number().describe('What this product cost to buy (FIFO)'),
        basePrice: z.number().describe('Normal selling price'),
        batchId: z.string().nullable(),
        status: z.enum(['IN_STOCK', 'OUT_OF_STOCK', 'LOW_STOCK']),
        lastRestockDate: z.string().nullable(),
    }),

    execute: effectToToolExecutor(async (input) => {
        const { productId, organizationId } = input;

        // Provide organization context for Effect services
        return Effect.gen(function* (_) {
            // Get product details
            const product = yield* _(productService.getProductById(productId));
            if (!product) {
                return yield* _(Effect.fail(new Error(`Product ${productId} not found`)));
            }

            // Get current FIFO cost
            const fifoCost = yield* _(fifoService.getCurrentFifoCost(productId));

            // Get current stock
            const stock = yield* _(fifoService.getCurrentStock(productId));

            // Determine status
            let status: 'IN_STOCK' | 'OUT_OF_STOCK' | 'LOW_STOCK';
            if (stock <= 0) {
                status = 'OUT_OF_STOCK';
            } else if (stock < 10) { // TODO: Make threshold configurable
                status = 'LOW_STOCK';
            } else {
                status = 'IN_STOCK';
            }

            return {
                productId: product.id,
                productName: product.name,
                currentStock: stock,
                currentFifoCost: fifoCost,
                basePrice: product.basePrice,
                batchId: null, // TODO: Get from FIFO service
                status,
                lastRestockDate: null, // TODO: Get from purchase orders
            };
        }).pipe(
            Effect.provide(OrganizationContext.make(organizationId))
        );
    }),
});

/**
 * Profit Calculator Tool
 * 
 * THE SAFETY CHECK for all promo proposals.
 * Validates that proposed promotions are profitable.
 */
export const profitCalculatorTool = createTool({
    id: 'calculate-profit',
    description: `
Calculate profit for a proposed promo discount.
Given:
- Product ID
- Discount percentage
- Quantity expected to sell

Returns:
- Profit per unit
- Total estimated profit
- Profit margin percentage
- Whether it's profitable (true/false)
- Recommendation (approve/review/reject)

USE THIS to validate every promo proposal before suggesting it.
WE ONLY EARN 5% OF PROFIT CREATED, so prioritize profitability.
  `.trim(),

    inputSchema: z.object({
        productId: z.string(),
        organizationId: z.string(),
        discountPercent: z.number().min(0).max(100),
        estimatedQuantity: z.number().int().positive(),
    }),

    outputSchema: z.object({
        profitPerUnit: z.number(),
        totalEstimatedProfit: z.number(),
        profitMargin: z.number().describe('Margin as percentage'),
        isProfitable: z.boolean(),
        recommendation: z.enum(['APPROVE', 'REVIEW', 'REJECT']),
        reasoning: z.string(),
    }),

    execute: effectToToolExecutor(async (input) => {
        const { productId, organizationId, discountPercent, estimatedQuantity } = input;

        return Effect.gen(function* (_) {
            // Get product and FIFO cost
            const product = yield* _(productService.getProductById(productId));
            if (!product) {
                return yield* _(Effect.fail(new Error(`Product ${productId} not found`)));
            }

            const fifoCost = yield* _(fifoService.getCurrentFifoCost(productId));

            // Calculate discounted price
            const discountedPrice = product.basePrice * (1 - discountPercent / 100);

            // Calculate profit (using ProfitCalculator service)
            const profitPerUnit = yield* _(
                ProfitCalculator.calculateProfit({
                    sellingPrice: discountedPrice,
                    costPrice: fifoCost,
                    quantity: 1,
                })
            );

            const totalProfit = profitPerUnit * estimatedQuantity;
            const profitMargin = (profitPerUnit / discountedPrice) * 100;

            // Determine recommendation
            let recommendation: 'APPROVE' | 'REVIEW' | 'REJECT';
            let reasoning: string;

            if (profitPerUnit < 0) {
                recommendation = 'REJECT';
                reasoning = `LOSS-MAKING: You'd lose KES ${Math.abs(profitPerUnit).toFixed(2)} per unit. Total loss: KES ${Math.abs(totalProfit).toFixed(2)}`;
            } else if (profitMargin < 10) {
                recommendation = 'REVIEW';
                reasoning = `LOW MARGIN: Only ${profitMargin.toFixed(1)}% margin. Consider reducing discount to 5-${discountPercent - 5}%`;
            } else if (profitMargin >= 10 && profitMargin < 20) {
                recommendation = 'APPROVE';
                reasoning = `ACCEPTABLE: ${profitMargin.toFixed(1)}% margin, estimated profit KES ${totalProfit.toFixed(2)}`;
            } else {
                recommendation = 'APPROVE';
                reasoning = `EXCELLENT: ${profitMargin.toFixed(1)}% margin, estimated profit KES ${totalProfit.toFixed(2)}. Consider scaling this promo.`;
            }

            return {
                profitPerUnit,
                totalEstimatedProfit: totalProfit,
                profitMargin,
                isProfitable: profitPerUnit > 0,
                recommendation,
                reasoning,
            };
        }).pipe(
            Effect.provide(OrganizationContext.make(organizationId))
        );
    }),
});

/**
 * Customer Verification Tool
 * 
 * Check age verification and compliance status for a customer.
 */
export const verificationTool = createTool({
    id: 'verify-customer',
    description: `
Check if a customer is verified and compliant to receive promos.
For B2C: Checks age verification (18+ for alcohol)
For B2B: Checks license validity

Returns verification status and next steps if not verified.
  `.trim(),

    inputSchema: z.object({
        customerId: z.string().describe('Customer phone number'),
        organizationId: z.string(),
        customerType: z.enum(['B2C', 'B2B']),
    }),

    outputSchema: z.object({
        verified: z.boolean(),
        customerType: z.enum(['B2C', 'B2B']),
        canReceivePromo: z.boolean(),
        reason: z.string().optional(),
        nextStep: z.string().optional().describe('What to do if not verified'),
    }),

    execute: async (input) => {
        const { customerId, customerType } = input;

        // TODO: Wire to actual verification service
        // For now, mock response
        return {
            verified: false,
            customerType,
            canReceivePromo: false,
            reason: 'Age verification required',
            nextStep: 'Send age verification request via WhatsApp',
        };
    },
});
