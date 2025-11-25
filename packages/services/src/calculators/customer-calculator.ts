export interface CustomerLTVParams {
    totalSpend: number;
    totalOrders: number;
    attributedRevenue: number;
}

export interface CustomerLTVResult {
    lifetimeValue: number;
    averageOrderValue: number;
}

export interface TierEligibilityParams {
    totalSpend: number;
    totalOrders: number;
    bronzeThreshold?: number;
    silverThreshold?: number;
    goldThreshold?: number;
}

export type CustomerTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export class CustomerCalculator {
    static calculateLTV(params: CustomerLTVParams): CustomerLTVResult {
        const { totalSpend, totalOrders, attributedRevenue } = params;

        const lifetimeValue = attributedRevenue || totalSpend;
        const averageOrderValue = totalOrders > 0 ? totalSpend / totalOrders : 0;

        return {
            lifetimeValue,
            averageOrderValue,
        };
    }

    static calculateTierEligibility(params: TierEligibilityParams): CustomerTier {
        const {
            totalSpend,
            totalOrders,
            bronzeThreshold = 0,
            silverThreshold = 50000,
            goldThreshold = 200000,
        } = params;

        if (totalSpend >= goldThreshold && totalOrders >= 10) {
            return 'platinum';
        }
        if (totalSpend >= goldThreshold) {
            return 'gold';
        }
        if (totalSpend >= silverThreshold) {
            return 'silver';
        }
        return 'bronze';
    }

    static calculateAverageOrderValue(totalSpend: number, totalOrders: number): number {
        return totalOrders > 0 ? totalSpend / totalOrders : 0;
    }
}
