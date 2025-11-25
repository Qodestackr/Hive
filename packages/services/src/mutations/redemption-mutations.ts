/**
 * Promo Code Redemption Mutations
 * 
 * Pure functions for building database mutations.
 * This separates WHAT to change from HOW to change it.
 */

import { createId } from "@paralleldrive/cuid2";
import type { ProfitCalculationResult } from "../calculators/profit-calculator";

// Database types (inferred from schema)
type PromoCode = any; // Will be inferred from DB usage
type Product = any;
type Campaign = any;
type Customer = any;

export interface FifoResult {
    method: 'fifo' | 'weighted_average' | 'fallback';
    unitCost: number;
    batchId?: string;
    batchNumber?: string | null;
    expiryDate?: string | null;
}

/**
 * Mutation objects (pure data)
 * Describes what should change in the database
 */
export interface RedemptionMutations {
    promoCodeUpdate: {
        id: string;
        isRedeemed: true;
        redeemedAt: Date;
        quantityRedeemed: number;
        originalPrice: number;
        discountAmount: number;
        netRevenue: number;
        unitCostAtRedemption: number;
        totalCOGS: number;
        actualProfit: number;
        isProfitable: boolean;
        costCalculationMethod: string;
        saleorOrderId: string | null;
    };

    inventoryMovement: {
        id: string;
        organizationId: string;
        productId: string;
        movementType: 'stock_out';
        quantity: number;
        unitCostAtMovement: number;
        totalCost: number;
        fifoBatchId: string | null;
        referenceType: 'promo_redemption';
        referenceId: string;
        campaignId: string | null;
        promoCodeId: string;
        stockAfterMovement: number;
        notes: string;
        createdAt: Date;
    };

    productUpdate: {
        id: string;
        currentStockQuantity: number;
        updatedAt: Date;
    };

    campaignUpdate?: {
        id: string;
        totalCOGS: number;
        actualProfit: number;
        redemptionsUsed: number;
        discountCost: number;
        revenue: number;
        conversions: number;
        isLosingMoney: boolean;
        avgProfitPerRedemption: number;
        updatedAt: Date;
    };

    customerUpdate?: {
        id: string;
        totalSpendIncrement: number;
        attributedRevenueIncrement: number;
        totalOrdersIncrement: number;
        lastOrderAt: Date;
        updatedAt: Date;
    };
}

/**
 * Build redemption mutations (PURE FUNCTION)
 * 
 * Given current state, returns desired mutations.
 * No side effects, no database access, fully testable.
 * 
 * @param params - Current state
 * @returns Mutation objects describing what to change
 */
export function buildRedemptionMutations(params: {
    promoCode: PromoCode;
    product: Product;
    fifoResult: FifoResult;
    profit: ProfitCalculationResult;
    quantityRedeemed: number;
    organizationId: string;
    campaign?: Campaign;
    saleorOrderId?: string;
}): RedemptionMutations {
    const {
        promoCode,
        product,
        fifoResult,
        profit,
        quantityRedeemed,
        organizationId,
        campaign,
        saleorOrderId,
    } = params;

    // Build mutations object
    const mutations: RedemptionMutations = {
        // 1. Update promo code with redemption data
        promoCodeUpdate: {
            id: promoCode.id,
            isRedeemed: true,
            redeemedAt: new Date(),
            quantityRedeemed,
            originalPrice: profit.originalPrice,
            discountAmount: profit.discountAmount,
            netRevenue: profit.netRevenue,
            unitCostAtRedemption: fifoResult.unitCost,
            totalCOGS: profit.totalCOGS,
            actualProfit: profit.actualProfit,
            isProfitable: profit.isProfitable,
            costCalculationMethod: fifoResult.method,
            saleorOrderId: saleorOrderId || null,
        },

        // 2. Create inventory movement (immutable ledger)
        inventoryMovement: {
            id: createId(),
            organizationId,
            productId: product.id,
            movementType: 'stock_out',
            quantity: -quantityRedeemed, // Negative for stock out
            unitCostAtMovement: fifoResult.unitCost,
            totalCost: profit.totalCOGS,
            fifoBatchId: fifoResult.batchId || null,
            referenceType: 'promo_redemption',
            referenceId: promoCode.id,
            campaignId: promoCode.campaignId,
            promoCodeId: promoCode.id,
            stockAfterMovement: (product.currentStockQuantity || 0) - quantityRedeemed,
            notes: `Promo code ${promoCode.code} redeemed`,
            createdAt: new Date(),
        },

        // 3. Update product stock
        productUpdate: {
            id: product.id,
            currentStockQuantity: (product.currentStockQuantity || 0) - quantityRedeemed,
            updatedAt: new Date(),
        },
    };

    // 4. Update campaign totals (if campaign exists)
    if (campaign) {
        const newRedemptionsUsed = (campaign.redemptionsUsed || 0) + 1;
        const newRevenue = (campaign.revenue || 0) + profit.netRevenue;
        const newDiscountCost = (campaign.discountCost || 0) + profit.discountAmount;
        const newTotalCOGS = (campaign.totalCOGS || 0) + profit.totalCOGS;
        const newActualProfit = (campaign.actualProfit || 0) + profit.actualProfit;
        const isLosingMoney = newActualProfit < 0;

        mutations.campaignUpdate = {
            id: campaign.id,
            totalCOGS: newTotalCOGS,
            actualProfit: newActualProfit,
            redemptionsUsed: newRedemptionsUsed,
            discountCost: newDiscountCost,
            revenue: newRevenue,
            conversions: newRedemptionsUsed,
            isLosingMoney,
            avgProfitPerRedemption: newActualProfit / newRedemptionsUsed,
            updatedAt: new Date(),
        };
    }

    // 5. Update customer LTV (if customer exists)
    if (promoCode.customerId) {
        mutations.customerUpdate = {
            id: promoCode.customerId,
            totalSpendIncrement: profit.netRevenue,
            attributedRevenueIncrement: profit.netRevenue,
            totalOrdersIncrement: 1,
            lastOrderAt: new Date(),
            updatedAt: new Date(),
        };
    }

    return mutations;
}
