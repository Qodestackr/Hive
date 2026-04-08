import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';

const workflowInputSchema = z.object({
    code: z.string(),
    customerId: z.string(),
    organizationId: z.string(),
});

const validatePromoStep = createStep({
    id: 'validate-promo',
    inputSchema: workflowInputSchema,
    outputSchema: z.object({
        valid: z.boolean(),
        promoId: z.string().nullable(),
        discountPercent: z.number().nullable(),
        productId: z.string().nullable(),
        reason: z.string().optional(),
        customerId: z.string(),
        organizationId: z.string(),
    }),
    execute: async ({ inputData }) => {
        const { code, customerId, organizationId } = inputData;

        // TODO: Wire to Effect promoCodeService
        return {
            valid: true,
            promoId: 'promo_123',
            discountPercent: 20,
            productId: 'prod_tusker',
            reason: undefined,
            customerId,
            organizationId,
        };
    },
});

const checkProfitStep = createStep({
    id: 'check-profit',
    inputSchema: validatePromoStep.outputSchema,
    outputSchema: z.object({
        profitPerUnit: z.number(),
        totalProfit: z.number(),
        profitMargin: z.number(),
        isProfitable: z.boolean(),
        recommendation: z.enum(['APPROVE', 'REVIEW', 'REJECT']),
        promoId: z.string(),
        productId: z.string(),
        customerId: z.string(),
        organizationId: z.string(),
    }),
    execute: async ({ inputData }) => {
        // TODO: Wire to Effect ProfitCalculator
        return {
            profitPerUnit: 50,
            totalProfit: 50,
            profitMargin: 15,
            isProfitable: true,
            recommendation: 'APPROVE' as const,
            promoId: inputData.promoId!,
            productId: inputData.productId!,
            customerId: inputData.customerId,
            organizationId: inputData.organizationId,
        };
    },
});

const createDraftOrderStep = createStep({
    id: 'create-draft-order',
    inputSchema: checkProfitStep.outputSchema,
    outputSchema: z.object({
        draftOrderId: z.string(),
        totalValue: z.number(),
        customerId: z.string(),
        promoId: z.string(),
    }),
    execute: async ({ inputData }) => {
        // TODO: Wire to Saleor integration
        return {
            draftOrderId: `draft_${Date.now()}`,
            totalValue: 15000,
            customerId: inputData.customerId,
            promoId: inputData.promoId,
        };
    },
});

const APPROVAL_THRESHOLD = 10000;

const approvalStep = createStep({
    id: 'approval-gate',
    inputSchema: createDraftOrderStep.outputSchema,
    outputSchema: z.object({
        approved: z.boolean(),
        approvedBy: z.string().nullable(),
        draftOrderId: z.string(),
        promoId: z.string(),
    }),
    resumeSchema: z.object({
        approved: z.boolean(),
        approvedBy: z.string().optional(),
    }),
    execute: async ({ inputData, resumeData, suspend }) => {
        const { totalValue, draftOrderId, promoId } = inputData;

        if (totalValue > APPROVAL_THRESHOLD && (!resumeData || resumeData.approved === undefined)) {
            return await suspend({});
        }

        return {
            approved: resumeData?.approved ?? true,
            approvedBy: resumeData?.approvedBy ?? null,
            draftOrderId,
            promoId,
        };
    },
});

const finalizeOrderStep = createStep({
    id: 'finalize-order',
    inputSchema: approvalStep.outputSchema,
    outputSchema: z.object({
        orderId: z.string().nullable(),
        status: z.enum(['COMPLETED', 'REJECTED']),
        message: z.string(),
    }),
    execute: async ({ inputData }) => {
        if (!inputData.approved) {
            return {
                orderId: null,
                status: 'REJECTED' as const,
                message: 'Order rejected by manager',
            };
        }

        // TODO: Wire to Saleor finalize API
        return {
            orderId: `order_${Date.now()}`,
            status: 'COMPLETED' as const,
            message: 'Order completed successfully',
        };
    },
});

const invalidCodeStep = createStep({
    id: 'invalid-code-error',
    inputSchema: validatePromoStep.outputSchema,
    outputSchema: z.object({
        orderId: z.string().nullable(),
        status: z.string(),
        message: z.string(),
    }),
    execute: async ({ inputData }) => ({
        orderId: null,
        status: 'INVALID_CODE',
        message: inputData.reason || 'Invalid promo code',
    }),
});

export const promoRedemptionWorkflow = createWorkflow({
    id: 'promo-redemption-workflow',
    inputSchema: workflowInputSchema,
    outputSchema: z.object({
        orderId: z.string().nullable(),
        status: z.string(),
        message: z.string(),
    }),
})
    .then(validatePromoStep)
    .branch([
        [async ({ inputData }) => inputData.valid === true, checkProfitStep],
        [async ({ inputData }) => inputData.valid === false, invalidCodeStep],
    ])
    .then(createDraftOrderStep)
    .then(approvalStep)
    .then(finalizeOrderStep)
    .commit();