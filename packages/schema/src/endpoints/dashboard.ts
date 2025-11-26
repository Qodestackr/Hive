import { z } from "zod";
import { registerRoute } from "../utils/route-builder.js";

// Get dashboard overview
registerRoute({
	method: "get",
	path: "/api/v1/dashboard/overview",
	summary: "Get dashboard overview",
	description:
		"Get high-level metrics for the distributor dashboard (campaigns, profit, customers).",
	tags: ["Dashboard"],
	response: z.object({
		totalCampaigns: z.number().int(),
		activeCampaigns: z.number().int(),
		totalProfit: z.number(),
		totalRevenue: z.number(),
		totalRedemptions: z.number().int(),
		profitableRedemptions: z.number().int(),
		totalCustomers: z.number().int(),
		verifiedCustomers: z.number().int(),
		optedInCustomers: z.number().int(),
		lifetimeValue: z.number(),
	}),
});
