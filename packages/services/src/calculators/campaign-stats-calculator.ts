export interface CampaignMetricsInput {
	// Promo code stats
	totalCodes: number;
	redeemedCodes: number;
	profitableCodes: number;
	totalRevenue: number;
	discountCost: number;
	totalCOGS: number;
	actualProfit: number;

	// Engagement stats
	sent: number;
	delivered: number;
	opened: number;
	clicked: number;
	conversions: number;
}

export interface CampaignMetricsOutput {
	// Redemption metrics
	redemptionRate: number;
	lossRate: number;
	avgProfitPerRedemption: number | null;

	// Engagement metrics
	deliveryRate: number;
	openRate: number;
	clickRate: number;
	conversionRate: number;

	// Financial metrics
	roi: number;
}

export const CampaignStatsCalculator = {
	/**Calculate all campaign metrics */
	calculateMetrics(input: CampaignMetricsInput): CampaignMetricsOutput {
		// Redemption metrics
		const redemptionRate =
			input.totalCodes > 0 ? (input.redeemedCodes / input.totalCodes) * 100 : 0;

		const lossRate =
			input.redeemedCodes > 0
				? ((input.redeemedCodes - input.profitableCodes) /
					input.redeemedCodes) *
				100
				: 0;

		const avgProfitPerRedemption =
			input.redeemedCodes > 0 ? input.actualProfit / input.redeemedCodes : null;

		// Engagement metrics
		const deliveryRate =
			input.sent > 0 ? (input.delivered / input.sent) * 100 : 0;

		const openRate =
			input.delivered > 0 ? (input.opened / input.delivered) * 100 : 0;

		const clickRate =
			input.opened > 0 ? (input.clicked / input.opened) * 100 : 0;

		const conversionRate =
			input.clicked > 0 ? (input.conversions / input.clicked) * 100 : 0;

		// Financial metrics
		const totalCost = input.discountCost;
		const roi = totalCost > 0 ? (input.actualProfit / totalCost) * 100 : 0;

		return {
			redemptionRate,
			lossRate,
			avgProfitPerRedemption,
			deliveryRate,
			openRate,
			clickRate,
			conversionRate,
			roi,
		};
	},
};
