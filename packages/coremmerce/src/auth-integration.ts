/**
 * Auth Integration Layer for Saleor Provisioning
 * 
 * Provides Promise-based wrapper around Effect API for use in auth hooks
 * where Better Auth expects Promise returns.
 * 
 * Usage in auth.ts:
 * ```typescript
 * import { provisionSaleorForUser } from '@repo/coremmerce/auth-integration'
 * 
 * organization.afterCreate: async ({ organization, user }) => {
 *   try {
 *     const result = await provisionSaleorForUser(user.id, organization.id)
 *     console.log('✅ Saleor provisioned:', result)
 *   } catch (error) {
 *     console.error('❌ Provisioning failed:', error)
 *     // Don't throw - let user continue, they can retry later
 *   }
 * }
 * ```
 */

import { Effect } from "effect"
import { OrganizationContext } from "@repo/utils"
import { saleorProvisioningService, type ProvisioningResult } from "./services/saleor-provisioning.service"
import type { SaleorDomainError } from "./errors/saleor-errors"
import type { DatabaseError } from "@repo/utils/errors/domain"

/**
 * Promise-based wrapper for provisioning Saleor resources
 * 
 * @param userId - User ID creating the organization
 * @param organizationId - Organization ID to provision for
 * @param sessionId - Optional session ID to update
 * @returns Promise with provisioning result
 * @throws Typed error with detailed Saleor response
 */
export async function provisionSaleorForUser(
    userId: string,
    organizationId: string,
    sessionId?: string
): Promise<ProvisioningResult> {
    const program = saleorProvisioningService
        .provisionEffect(userId, sessionId)
        .pipe(
            Effect.provideService(OrganizationContext, OrganizationContext.of({ organizationId }))
        )

    try {
        const result = await Effect.runPromise(program)
        return result
    } catch (error) {
        // Re-throw with better error message
        if (isSaleorError(error)) {
            console.error("Saleor provisioning error:", {
                type: error._tag,
                message: error.message,
                ...(error as any),
            })
        }
        throw error
    }
}

/**
 * Type guard for Saleor errors
 */
function isSaleorError(error: unknown): error is SaleorDomainError {
    return (
        error !== null &&
        typeof error === "object" &&
        "_tag" in error &&
        typeof (error as any)._tag === "string" &&
        (error as any)._tag.startsWith("Saleor")
    )
}

/**
 * Helper to check if resources already exist (for UI checks)
 */
export async function checkSaleorResourcesExist(
    organizationId: string
): Promise<boolean> {
    try {
        const result = await provisionSaleorForUser(
            "dummy", // Not used if already exists
            organizationId
        )
        return result.alreadyExisted
    } catch {
        return false
    }
}
