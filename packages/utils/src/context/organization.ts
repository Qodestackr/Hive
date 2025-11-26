import { Context } from "effect";

export interface OrganizationContext {
	readonly organizationId: string;
}

/**
 * Org context for effect
 *
 * Provides organizationId to all services without prop drilling.
 * Injected once at API boundary, available everywhere.
 */
export const OrganizationContext = Context.GenericTag<OrganizationContext>(
	"@repo/context/OrganizationContext",
);
