/**
 * Apply Redemption Mutations WITH Audit Log (ATOMIC)
 * 
 * CRITICAL: Audit log and mutation happen in SAME transaction.
 * If either fails, both roll back. No partial state.
 * 
 * Tradeoff:
 * - Pro: Consistency guaranteed. If promo redeems, log ALWAYS exists.
 * - Con: Slower. Audit log failure kills the business operation.
 * 
 * For profit intelligence, we choose consistency over speed.
 */

import { createId } from "@paralleldrive/cuid2";
import { withTransaction, auditEvents } from "@repo/db";
import { applyRedemptionMutations } from "./apply-mutations";
import type { RedemptionMutations } from "./redemption-mutations";

export async function applyRedemptionWithAudit(
    mutations: RedemptionMutations,
    organizationId: string,
    promoCodeValue: string // Need the actual code for logging
): Promise<void> {
    await withTransaction(async (tx) => {
        // Apply all business mutations
        await applyRedemptionMutations(tx, mutations);

        // Insert audit log IN SAME TRANSACTION
        await tx.insert(auditEvents).values({
            id: createId(),
            organizationId,
            eventType: 'promo.redeemed',
            aggregateType: 'promo_code',
            aggregateId: mutations.promoCodeUpdate.id,
            eventData: {
                code: promoCodeValue,
                profit: mutations.promoCodeUpdate.actualProfit,
                unitCost: mutations.promoCodeUpdate.unitCostAtRedemption,
                isProfitable: mutations.promoCodeUpdate.isProfitable,
                campaignId: mutations.campaignUpdate?.id || null,
                timestamp: new Date().toISOString(),
            },
            createdAt: new Date(),
        });
    });

    // If we reach here, BOTH mutation and audit succeeded
    // If either fails, BOTH roll back
}
