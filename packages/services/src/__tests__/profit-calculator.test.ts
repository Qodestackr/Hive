import { describe, expect, test } from "bun:test";
import { ProfitCalculator } from "../calculators/profit-calculator";

describe("ProfitCalculator", () => {
	test("calculates profit correctly with percentage discount", () => {
		const result = ProfitCalculator.calculate({
			basePrice: 10000,
			quantity: 1,
			discountType: "percentage",
			discountValue: 20,
			unitCost: 7000,
		});

		expect(result.actualProfit).toBe(1000); // 8000 revenue - 7000 cost
		expect(result.isProfitable).toBe(true);
	});

	test("identifies unprofitable campaigns", () => {
		const result = ProfitCalculator.calculate({
			basePrice: 10000,
			quantity: 1,
			discountType: "percentage",
			discountValue: 30, // 7000 after discount
			unitCost: 8000,
		});

		expect(result.actualProfit).toBe(-1000);
		expect(result.isProfitable).toBe(false);
	});

	test("handles fixed amount discounts", () => {
		const result = ProfitCalculator.calculate({
			basePrice: 10000,
			quantity: 1,
			discountType: "fixed",
			discountValue: 2000,
			unitCost: 6000,
		});

		expect(result.actualProfit).toBe(2000); // 8000 revenue - 6000 cost
		expect(result.isProfitable).toBe(true);
	});

	test("handles multiple quantities", () => {
		const result = ProfitCalculator.calculate({
			basePrice: 5000,
			quantity: 10,
			discountType: "percentage",
			discountValue: 10,
			unitCost: 3000,
		});

		// 5000 * 0.9 = 4500 per unit
		// (4500 - 3000) * 10 = 15000 total profit
		expect(result.actualProfit).toBe(15000);
		expect(result.isProfitable).toBe(true);
	});

	test("edge case: zero discount", () => {
		const result = ProfitCalculator.calculate({
			basePrice: 10000,
			quantity: 1,
			discountType: "percentage",
			discountValue: 0,
			unitCost: 7000,
		});

		expect(result.actualProfit).toBe(3000); // 10000 - 7000
		expect(result.isProfitable).toBe(true);
	});

	test("edge case: break-even scenario", () => {
		const result = ProfitCalculator.calculate({
			basePrice: 10000,
			quantity: 1,
			discountType: "percentage",
			discountValue: 30,
			unitCost: 7000,
		});

		expect(result.actualProfit).toBe(0); // 7000 revenue - 7000 cost
		expect(result.isProfitable).toBe(false); // Break-even is not profitable
	});
});
