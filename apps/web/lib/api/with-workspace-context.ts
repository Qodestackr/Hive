import { type NextRequest, NextResponse } from "next/server"
import { redis, withCacheOperation } from "@repo/cache"
import { organizations, members, invitations, eq, and, withDbOperation } from "@repo/db"

import { createError, handleApiError, withErrorTrace } from "@repo/utils"
import db from "@repo/db"
import { getSafeSession } from "@/utils/auth-utils"
import { auth } from "@repo/auth"

// Infer types from Drizzle schema
type Organization = typeof organizations.$inferSelect
type Member = typeof members.$inferSelect
type Invitation = typeof invitations.$inferSelect

export type WorkspaceWithMembers = Organization & {
  members: (Member & {
    permissions: string[]
  })[]
}

export type WorkspaceContext = {
  warehouseId?: string
  channelId?: string
}

export interface WorkspaceHandlerParams {
  req: NextRequest
  params: Record<string, string>
  searchParams: Record<string, string>
  headers?: Record<string, string>
  session: any
  workspace: WorkspaceWithMembers
  permissions: string[]
  context?: WorkspaceContext
}

export type WorkspaceHandler = (params: WorkspaceHandlerParams) => Promise<Response>

export interface WithWorkspaceOptions {
  requiredPermissions?: string[]
  requiredBusinessTypes?: Array<'retailer' | 'wholesaler' | 'distributor' | 'brand_owner'>
  skipPermissionChecks?: boolean
  requireActiveSubscription?: boolean
  subscriptionStatuses?: Array<'active' | 'trialing' | 'past_due' | 'unpaid' | 'canceled' | 'paused'>
  cacheResponse?: boolean
  cacheTTL?: number // in secs
}

/**
 * Helper 1: Resolve organization ID from request params/searchParams
 * NO FALLBACKS - caller must provide organizationId or slug explicitly
 */
function resolveOrganizationId(
  params: Record<string, string>,
  searchParams: Record<string, string>
): { organizationId?: string; organizationSlug?: string } {
  const organizationId =
    params.organizationId || searchParams.organizationId ||
    params.workspaceId || searchParams.workspaceId

  const organizationSlug =
    params.slug || searchParams.slug ||
    params.organizationSlug || searchParams.organizationSlug

  return { organizationId, organizationSlug }
}

/**
 * Helper 2: Fetch organization subscription/business data from DB
 * Uses Drizzle + withDbOperation for proper error handling
 */
async function fetchOrganizationExtras(
  organizationId: string
): Promise<{
  subscriptionStatus: string
  businessType: string
  pricingVersion: string
  basePrice: number | null
  trialEndsAt: Date | null
} | null> {
  return withDbOperation(
    {
      operation: "findUnique",
      table: "organization",
      context: { organizationId },
    },
    async () => {
      const result = await db
        .select({
          subscriptionStatus: organizations.subscriptionStatus,
          businessType: organizations.businessType,
          pricingVersion: organizations.pricingVersion,
          basePrice: organizations.basePrice,
          trialEndsAt: organizations.trialEndsAt,
        })
        .from(organizations)
        .where(eq(organizations.id, organizationId))
        .limit(1)

      return result[0] || null
    }
  )
}

/**
 * Helper 3: Check if user has pending invitation to organization
 * Returns invitation if found, null otherwise
 */
async function checkPendingInvitation(
  email: string,
  organizationId: string
): Promise<Invitation | null> {
  return withDbOperation(
    {
      operation: "findFirst",
      table: "invitation",
      context: { email, organizationId },
    },
    async () => {
      const result = await db
        .select()
        .from(invitations)
        .where(
          and(
            eq(invitations.email, email),
            eq(invitations.organizationId, organizationId),
            eq(invitations.status, "pending")
          )
        )
        .limit(1)

      return result[0] || null
    }
  )
}

/**
 * Helper 4: Validate user is a member of the organization
 * Checks for pending/expired invitations if not a member
 * 
 * @throws createError.businessRule("invite_expired")
 * @throws createError.businessRule("invite_pending")
 * @throws createError.forbidden("not_a_member")
 */
async function validateMembership(
  currentMember: any | undefined,
  userEmail: string,
  organizationId: string,
  isWalletEndpoint: boolean
): Promise<void> {
  // Wallet endpoints allow B2C access (non-members)
  if (isWalletEndpoint) {
    return
  }

  if (!currentMember) {
    // Check for pending invitation
    const pendingInvite = await checkPendingInvitation(userEmail, organizationId)

    if (pendingInvite) {
      if (new Date(pendingInvite.expiresAt) < new Date()) {
        throw createError.businessRule("invite_expired", {
          organizationId,
          inviteId: pendingInvite.id,
        })
      } else {
        throw createError.businessRule("invite_pending", {
          organizationId,
          inviteId: pendingInvite.id,
        })
      }
    } else {
      throw createError.forbidden("You don't have access to this organization.", {
        organizationId,
      })
    }
  }
}

/**
 * Helper 5: Extract optional context IDs from params
 * No validation - these are just passed through
 */
function extractContextIds(
  params: Record<string, string>,
  searchParams: Record<string, string>
): WorkspaceContext {
  return {
    warehouseId: params.warehouseId || searchParams.warehouseId,
    channelId: params.channelId || searchParams.channelId,
  }
}

/**
 * HOF that wraps API handlers with workspace context and authentication
 */
export const withWorkspaceContext = (handler: WorkspaceHandler, options: WithWorkspaceOptions = {}) => {
  return async (req: NextRequest, { params = {} }: { params: Record<string, string> }): Promise<Response> => {
    return withErrorTrace(
      {
        operation: "workspace_context",
        attributes: {
          "http.method": req.method,
          "http.url": req.url,
          "http.params": JSON.stringify(params),
        },
      },
      async (span) => {
        const searchParams = Object.fromEntries(new URL(req.url).searchParams)
        const headers: Record<string, string> = {}
        let workspace: WorkspaceWithMembers | undefined
        const context: WorkspaceContext = extractContextIds(params, searchParams)

        try {
          // 1. Get session
          const { session } = await getSafeSession()

          if (!session?.user?.id) {
            // During build time, we might not have a session, so return a safe response
            if (process.env.NODE_ENV === 'production' && !session) {
              console.warn("Build time: No session available, returning empty response")
              return NextResponse.json({ error: "Build time - no session" }, { status: 200 })
            }

            throw createError.unauthorized("Unauthorized: Login required.", {
              url: req.url,
            })
          }

          // 2. Resolve organization ID (explicit - no fallbacks)
          const { organizationId, organizationSlug } = resolveOrganizationId(params, searchParams)

          if (!organizationId && !organizationSlug) {
            throw createError.validation(
              "Organization identifier is required. Provide organizationId or slug in params.",
              "organizationId",
              {
                url: req.url,
                userId: session.user.id,
                availableParams: Object.keys(params),
                availableSearchParams: Object.keys(searchParams),
              }
            )
          }


          span.setAttributes({
            "organization.id": organizationId || "unknown",
            "organization.slug": organizationSlug || "unknown",
          })

          span.setAttributes({
            "user.id": session.user.id,
            "user.email": session.user.email || "unknown",
          })

          // 3. Fetch organization + members from Better Auth
          const orgResult = await auth.api.getFullOrganization({
            query: {
              organizationId: organizationId || undefined,
              organizationSlug: organizationSlug || undefined,
            },
            headers: req.headers,
          });

          if (!orgResult) {
            throw createError.notFound("Organization", {
              organizationId,
              organizationSlug,
              userId: session.user.id,
            });
          }

          // Extract organization and members from Better Auth response
          const { organization: authOrg, members: authMembers } = orgResult;

          // Extract current member and permissions
          const currentMember = authMembers?.find((m: any) => m.userId === session.user.id);
          const actualPermissions: string[] = currentMember?.permissions || [];

          span.setAttributes({
            "organization.name": authOrg.name,
            "organization.id": authOrg.id,
          });

          // 4. Validate membership (throws if not allowed)
          const isWalletEndpoint = req.nextUrl.pathname.startsWith("/api/wallet");
          await validateMembership(currentMember, session.user.email!, authOrg.id, isWalletEndpoint);

          // 5. Fetch organization extras from DB
          const orgExtras = await fetchOrganizationExtras(authOrg.id);

          // 6. Merge Better Auth org + DB extras
          workspace = {
            ...authOrg,
            ...orgExtras,
            members: currentMember ? [currentMember] : [],
          } as WorkspaceWithMembers;

          span.setAttributes({
            "organization.business_type": workspace.businessType || "unknown",
            "user.role": currentMember?.role || "none",
          });

          // 7. Validate permissions (if required)
          if (!options.skipPermissionChecks && options.requiredPermissions?.length) {
            // Convert ["inventory.create", "warehouse.read"] 
            // to { inventory: ["create"], warehouse: ["read"] }
            const permissionsMap: Record<string, string[]> = {};

            for (const perm of options.requiredPermissions) {
              const [resource, action] = perm.split(".");
              if (!resource || !action) {
                throw new Error(`Invalid permission format: ${perm}. Use "resource.action"`);
              }

              if (!permissionsMap[resource]) {
                permissionsMap[resource] = [];
              }
              permissionsMap[resource].push(action);
            }

            const hasPermissionResult = await auth.api.hasPermission({
              headers: req.headers,
              body: {
                permissions: permissionsMap
              },
            });

            if (!hasPermissionResult?.success) {
              throw createError.forbidden(
                "Insufficient permissions",
                {
                  organizationId: workspace.id,
                  userId: session.user.id,
                  required: options.requiredPermissions,
                  userPermissions: actualPermissions,
                  role: currentMember?.role,
                }
              );
            }
          }

          span.setAttributes({
            "user.permissions": actualPermissions.join(","),
            "user.role": currentMember?.role || "none",
          });

          // 8. Check for cached response
          if (options.cacheResponse) {
            const cacheKey = generateCacheKey(req.url, workspace.id, session.user.id, context)

            const cachedResponse = await withCacheOperation(
              {
                operation: "get",
                key: cacheKey,
                context: {
                  organizationId: workspace.id,
                  userId: session.user.id,
                },
              },
              () => redis.get(cacheKey),
            )

            if (cachedResponse && typeof cachedResponse === "string") {
              span.setAttributes({ "cache.hit": true })
              return NextResponse.json(JSON.parse(cachedResponse), { headers })
            }

            span.setAttributes({ "cache.hit": false })
          }

          // 9. Call handler with workspace context
          const response = await handler({
            req,
            params,
            searchParams,
            headers,
            session,
            workspace,
            permissions: actualPermissions, // ✅ ACTUAL permissions from Better Auth member
            context,
          })

          // 10. Cache response if successful
          if (options.cacheResponse && response.status === 200) {
            const cacheKey = generateCacheKey(req.url, workspace.id, session.user.id, context)

            const responseData = await response.json()

            await withCacheOperation(
              {
                operation: "set",
                key: cacheKey,
                ttl: options.cacheTTL || 3600, // default 1hr
                context: {
                  organizationId: workspace.id,
                  userId: session.user.id,
                },
              },
              () => redis.set(cacheKey, JSON.stringify(responseData), "EX", options.cacheTTL || 3600),
            )

            return NextResponse.json(responseData, { headers })
          }

          return response
        } catch (error) {
          // Let withErrorTrace handle the error
          throw error
        }
      },
    ).catch((error: any) => {
      // This only runs if withErrorTrace itself fails
      return handleApiError(error, "workspace_context", {
        url: req.url,
        method: req.method,
        params,
      })
    })
  }
}

/**
 * Generate a cache key based on the request and context
 */
function generateCacheKey(url: string, workspaceId: string, userId: string, context: WorkspaceContext): string {
  const urlObj = new URL(url)
  const baseKey = `api:${urlObj.pathname}:${workspaceId}:${userId}`

  // Add context to the key if present
  const contextParts = []
  if (context.warehouseId) contextParts.push(`warehouse:${context.warehouseId}`)
  if (context.channelId) contextParts.push(`channel:${context.channelId}`)

  // Add search params to the key
  const searchParamsStr = urlObj.searchParams.toString()

  return [baseKey, ...contextParts, searchParamsStr].filter(Boolean).join(":")
}
