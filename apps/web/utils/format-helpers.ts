/**
 * Safely formats a number as currency with locale string
 * Handles null, undefined, NaN, and Infinity values
 */
export function formatCurrency(
	value: number | null | undefined,
	currency = "KES",
): string {
	const safeValue = Number(value) || 0;

	if (!isFinite(safeValue)) {
		return `${currency} 0`;
	}

	try {
		return `${currency} ${Math.abs(safeValue).toLocaleString()}`;
	} catch {
		return `${currency} ${Math.abs(safeValue)}`;
	}
}

/**
 * Safely formats a number with locale string
 * Handles null, undefined, NaN, and Infinity values
 */
export function formatNumber(value: number | null | undefined): string {
	const safeValue = Number(value) || 0;

	if (!isFinite(safeValue)) {
		return "0";
	}

	try {
		return safeValue.toLocaleString();
	} catch {
		return safeValue.toString();
	}
}

/**
 * Safely calculates percentage avoiding division by zero
 */
export function calculatePercentage(
	current: number | null | undefined,
	total: number | null | undefined,
): number {
	const safeCurrent = Number(current) || 0;
	const safeTotal = Number(total) || 0;

	if (safeTotal <= 0 || !isFinite(safeCurrent) || !isFinite(safeTotal)) {
		return 0;
	}

	const percentage = (safeCurrent / safeTotal) * 100;
	return isFinite(percentage) ? Math.min(100, Math.max(0, percentage)) : 0;
}

/**
 * Safely gets a transaction amount ensuring it's a valid number
 */
export function safeAmount(amount: number | null | undefined): number {
	const value = Number(amount);
	return isFinite(value) ? value : 0;
}
