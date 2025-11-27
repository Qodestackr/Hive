import {
	BackInStockAgent,
	BackInStockAgentResponseSchema,
	BackInStockAgentUserInputSchema,
} from "@repo/ai";
import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";

export const POST = createWorkspaceRouteEffect({
	inputSchema: BackInStockAgentUserInputSchema,
	outputSchema: BackInStockAgentResponseSchema,

	handler: (data, ctx) =>
		BackInStockAgent.runEffect({
			...data,
			organizationSnapshot: {
				id: ctx.workspace.id,
				name: ctx.workspace.name,
				businessType: ctx.workspace.businessType ?? null,
				location:
					(ctx.workspace.metadata as Record<string, any> | undefined)?.location ?? null,
				analyticsSummary:
					(ctx.workspace.metadata as Record<string, any> | undefined)?.analyticsSummary ??
					null,
			},
		}),

	options: {
		operationName: "triggerBackInStockAgent",
		requiredPermissions: ["inventory.read", "campaigns.create"],
		errorContext: {
			feature: "ai-agents",
			action: "back-in-stock",
		},
	},
});