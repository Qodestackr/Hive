export interface IdempotencyKey {
	key: string;
	expiresAt: Date;
}

export interface IdempotencyResult<T> {
	isNew: boolean; // true if first execution
	result?: T; // cached result if duplicate
}

export interface IdempotencyOptions {
	ttlMs?: number;
	namespace?: string; // e.g., 'promo_redemption', 'webhook', 'payment'
}
