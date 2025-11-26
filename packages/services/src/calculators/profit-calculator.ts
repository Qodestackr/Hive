export interface ProfitCalculationParams {
	basePrice: number;
	quantity: number;
	discountType: "percentage" | "fixed";
	discountValue: number;
	unitCost: number;
}

export interface ProfitCalculationResult {
	originalPrice: number;
	discountAmount: number;
	netRevenue: number;
	totalCOGS: number;
	actualProfit: number;
	isProfitable: boolean;
	profitMargin: number;
}

export interface BreakEvenCalculationParams {
	basePrice: number;
	unitCost: number;
	targetMarginPercent?: number; // Default 10%
}

export interface BreakEvenCalculationResult {
	breakEvenPrice: number;
	maxDiscountAmount: number;
	maxDiscountPercent: number;
	safeDiscountPercent: number; // With target margin
	safeDiscountAmount: number;
}

export class ProfitCalculator {
	/**
	 * Calculate profit for a promo code redemption
	 * 
	 * @example
	 * const result = ProfitCalculator.calculate({
	 *   basePrice: 11000,
	 *   quantity: 1,
	 *   discountType: 'percentage',
	 *   discountValue: 20,
	 *   unitCost: 9200,
	 * });
	 * // result.actualProfit = -400 (losing money)
	 */
	static calculate(params: ProfitCalculationParams): ProfitCalculationResult {
		const { basePrice, quantity, discountType, discountValue, unitCost } =
			params;

		// Calculate original price
		const originalPrice = basePrice * quantity;

		// Calculate discount amount
		const discountAmount =
			discountType === "percentage"
				? (originalPrice * discountValue) / 100
				: discountValue;

		// Calculate net revenue (after discount)
		const netRevenue = originalPrice - discountAmount;

		// Calculate total COGS (cost of goods sold)
		const totalCOGS = unitCost * quantity;

		// Calculate actual profit
		const actualProfit = netRevenue - totalCOGS;

		// Calculate profit margin
		const profitMargin = netRevenue > 0 ? (actualProfit / netRevenue) * 100 : 0;

		return {
			originalPrice,
			discountAmount,
			netRevenue,
			totalCOGS,
			actualProfit,
			isProfitable: actualProfit > 0,
			profitMargin,
		};
	}

	/**
	 * Calculate break-even discount for a product
	 *
	 * Used in pre-flight profit checks to suggest safe discounts.
	 *
	 * @example
	 * const result = ProfitCalculator.calculateBreakEven({
	 *   basePrice: 11000,
	 *   unitCost: 9200,
	 *   targetMarginPercent: 10,
	 * });
	 * // result.safeDiscountPercent = 6.36 (10% margin)
	 */
	static calculateBreakEven(
		params: BreakEvenCalculationParams,
	): BreakEvenCalculationResult {
		const { basePrice, unitCost, targetMarginPercent = 10 } = params;

		// Break-even price (no profit, no loss)
		const breakEvenPrice = unitCost;

		// Maximum discount to break even
		const maxDiscountAmount = basePrice - breakEvenPrice;
		const maxDiscountPercent = (maxDiscountAmount / basePrice) * 100;

		// Safe discount (with target margin)
		const targetProfitPerUnit = (targetMarginPercent / 100) * basePrice;
		const safePrice = unitCost + targetProfitPerUnit;
		const safeDiscountAmount = Math.max(0, basePrice - safePrice);
		const safeDiscountPercent = (safeDiscountAmount / basePrice) * 100;

		return {
			breakEvenPrice,
			maxDiscountAmount,
			maxDiscountPercent,
			safeDiscountPercent: Math.floor(safeDiscountPercent), // Round down for safety
			safeDiscountAmount,
		};
	}

	/**
	 * Calculate profit margin percentage
	 *
	 * Helper for quick margin calculations.
	 */
	static calculateMargin(profit: number, revenue: number): number {
		return revenue > 0 ? (profit / revenue) * 100 : 0;
	}

	/**
	 * Check if a discount will be profitable
	 *
	 * Quick check without full calculation.
	 */
	static isProfitable(params: ProfitCalculationParams): boolean {
		const result = ProfitCalculator.calculate(params);
		return result.isProfitable;
	}
}
