import { z } from "zod";
import {
	AlertSettingsResponseSchema,
	AlertSettingsUpdateSchema,
	AutoPauseActionResponseSchema,
	BulkProfitCheckRequestSchema,
	BulkProfitCheckResponseSchema,
	ProfitCheckRequestSchema,
	ProfitCheckResponseSchema,
} from "../campaigns/alert-settings.schema.js";
import {
	PromoProfitAlertCreateSchema,
	PromoProfitAlertListQuerySchema,
	PromoProfitAlertListResponseSchema,
	PromoProfitAlertResolveSchema,
	PromoProfitAlertSchema,
	PromoProfitAlertSummarySchema,
} from "../campaigns/profit-alert.schema.js";
import { registerRoute } from "../utils/route-builder.js";

// Check campaign profit margin
registerRoute({
	method: "post",
	path: "/api/v1/profit-alerts/{campaignId}/check",
	summary: "Check campaign profit margin",
	description:
		"Calculate current profit margin from redeemed promo codes and compare against threshold.",
	tags: ["Profit Alerts"],
	params: z.object({
		campaignId: z
			.string()
			.openapi({ param: { name: "campaignId", in: "path" } }),
	}),
	body: ProfitCheckRequestSchema,
	response: ProfitCheckResponseSchema,
	errors: {
		404: "Campaign not found",
	},
});

// Bulk profit check
registerRoute({
	method: "post",
	path: "/api/v1/profit-alerts/bulk-check",
	summary: "Bulk profit check",
	description: "Check profit margins for multiple campaigns at once.",
	tags: ["Profit Alerts"],
	body: BulkProfitCheckRequestSchema,
	response: BulkProfitCheckResponseSchema,
});

// Create profit alert
registerRoute({
	method: "post",
	path: "/api/v1/profit-alerts",
	summary: "Create profit alert",
	description: "Manually create a profit alert for a campaign.",
	tags: ["Profit Alerts"],
	body: PromoProfitAlertCreateSchema,
	response: PromoProfitAlertSchema,
	errors: {
		400: "Invalid input data",
		404: "Campaign not found",
	},
});

// List profit alerts
registerRoute({
	method: "get",
	path: "/api/v1/profit-alerts",
	summary: "List profit alerts",
	description: "Get paginated list of profit alerts with filtering.",
	tags: ["Profit Alerts"],
	query: PromoProfitAlertListQuerySchema,
	response: PromoProfitAlertListResponseSchema,
	errors: {
		400: "Invalid query parameters",
	},
});

// Get alert summary
registerRoute({
	method: "get",
	path: "/api/v1/profit-alerts/summary",
	summary: "Get alert summary",
	description: "Get aggregate alert statistics for the dashboard.",
	tags: ["Profit Alerts"],
	response: PromoProfitAlertSummarySchema,
});

// Resolve alert
registerRoute({
	method: "post",
	path: "/api/v1/profit-alerts/{id}/resolve",
	summary: "Resolve profit alert",
	description: "Mark a profit alert as resolved with action taken.",
	tags: ["Profit Alerts"],
	params: z.object({
		id: z.string().openapi({ param: { name: "id", in: "path" } }),
	}),
	body: PromoProfitAlertResolveSchema,
	response: PromoProfitAlertSchema,
	errors: {
		404: "Alert not found",
	},
});

// Get alert settings
registerRoute({
	method: "get",
	path: "/api/v1/profit-alerts/{campaignId}/settings",
	summary: "Get alert settings",
	description: "Get profit alert settings for a campaign.",
	tags: ["Profit Alerts"],
	params: z.object({
		campaignId: z
			.string()
			.openapi({ param: { name: "campaignId", in: "path" } }),
	}),
	response: AlertSettingsResponseSchema,
	errors: {
		404: "Campaign not found",
	},
});

// Update alert settings
registerRoute({
	method: "patch",
	path: "/api/v1/profit-alerts/{campaignId}/settings",
	summary: "Update alert settings",
	description: "Update profit alert settings for a campaign.",
	tags: ["Profit Alerts"],
	params: z.object({
		campaignId: z
			.string()
			.openapi({ param: { name: "campaignId", in: "path" } }),
	}),
	body: AlertSettingsUpdateSchema,
	response: AlertSettingsResponseSchema,
	errors: {
		400: "Invalid input data",
		404: "Campaign not found",
	},
});

// Auto-pause campaign
registerRoute({
	method: "post",
	path: "/api/v1/profit-alerts/{campaignId}/auto-pause",
	summary: "Auto-pause campaign",
	description:
		"Check profit margin and auto-pause campaign if below threshold.",
	tags: ["Profit Alerts"],
	params: z.object({
		campaignId: z
			.string()
			.openapi({ param: { name: "campaignId", in: "path" } }),
	}),
	response: AutoPauseActionResponseSchema,
	errors: {
		404: "Campaign not found",
	},
});
