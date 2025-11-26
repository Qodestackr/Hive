export interface ProductUpdateMutations {
	productUpdate: {
		id: string;
		name?: string;
		sku?: string;
		category?: string | null;
		description?: string | null;
		basePrice?: number;
		alcoholContent?: number | null;
		requiresAgeVerification?: boolean;
		images?: any;
		tags?: string[];
		isActive?: boolean;
		updatedAt: Date;
	};
}

export interface PriceUpdateMutations {
	productUpdate: {
		id: string;
		basePrice: number;
		currentStockQuantity?: number;
		updatedAt: Date;
	};
}

export function buildProductUpdateMutations(params: {
	productId: string;
	updates: {
		name?: string;
		sku?: string;
		category?: string | null;
		description?: string | null;
		basePrice?: number;
		alcoholContent?: number | null;
		requiresAgeVerification?: boolean;
		images?: any;
		tags?: string[];
		isActive?: boolean;
	};
}): ProductUpdateMutations {
	return {
		productUpdate: {
			id: params.productId,
			...params.updates,
			updatedAt: new Date(),
		},
	};
}

export function buildPriceUpdateMutations(params: {
	productId: string;
	basePrice: number;
	currentStockQuantity?: number;
}): PriceUpdateMutations {
	return {
		productUpdate: {
			id: params.productId,
			basePrice: params.basePrice,
			currentStockQuantity: params.currentStockQuantity,
			updatedAt: new Date(),
		},
	};
}
