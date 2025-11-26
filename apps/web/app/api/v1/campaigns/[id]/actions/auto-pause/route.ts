import { AutoPauseActionResponseSchema } from "@repo/schema";
import { profitAlertService } from "@repo/services";
import { z } from "@repo/utils";
import { createWorkspaceRouteEffect } from "@/lib/api/create-api-route-effect";

export const POST = createWorkspaceRouteEffect({
	inputSchema: z.void(),
	outputSchema: AutoPauseActionResponseSchema,

	handler: (_data, context) =>
		profitAlertService.autoPauseCampaignEffect(context.params.id!),

	options: {
		operationName: "autoPauseCampaign",
		requiredPermissions: ["campaigns.manage"],
		errorContext: {
			feature: "profit-alerts",
			action: "auto-pause",
		},
	},
});
