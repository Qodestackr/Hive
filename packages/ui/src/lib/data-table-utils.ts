import type { Column } from "@tanstack/react-table";

export function getCommonPinningStyles<TData>({
	column,
}: {
	column: Column<TData>;
}) {
	const isPinned = column.getIsPinned();
	const isLastLeftPinnedColumn =
		isPinned === "left" && column.getIsLastColumn("left");
	const isFirstRightPinnedColumn =
		isPinned === "right" && column.getIsFirstColumn("right");

	return {
		boxShadow: isLastLeftPinnedColumn
			? "-4px 0 4px -4px gray inset"
			: isFirstRightPinnedColumn
				? "4px 0 4px -4px gray inset"
				: undefined,
		left: isPinned === "left" ? `${column.getStart("left")}px` : undefined,
		right: isPinned === "right" ? `${column.getAfter("right")}px` : undefined,
		opacity: isPinned ? 0.95 : 1,
		position: isPinned ? ("sticky" as const) : ("relative" as const),
		width: column.getSize(),
		zIndex: isPinned ? 1 : 0,
	};
}

export function formatCurrency(amount: number, currency = "KES"): string {
	return new Intl.NumberFormat("en-KE", {
		style: "currency",
		currency: currency,
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	}).format(amount);
}

export function formatNumber(value: number): string {
	return new Intl.NumberFormat("en-KE").format(value);
}
