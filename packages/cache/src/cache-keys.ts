/**
 * Cache Key Management
 *
 * This module provides type-safe cache key builders and pattern-based
 * invalidation support. All cache keys follow a consistent naming convention:
 *
 * Format: `namespace:identifier[:subkey][@tag1,tag2]`
 *
 * @module cache-keys
 */

/**
 * Cache key builder result with metadata
 */
export interface CacheKey {
	/** The full cache key string */
	key: string;
	/** Tags for multi-dimensional invalidation */
	tags: string[];
	/** Pattern for wildcard invalidation */
	pattern: string;
}

/**
 * Build a cache key with optional tags
 */
function buildKey(
	namespace: string,
	identifier: string,
	subkey?: string,
	tags: string[] = [],
): CacheKey {
	const parts = [namespace, identifier];
	if (subkey) parts.push(subkey);

	const baseKey = parts.join(":");
	const tagSuffix = tags.length > 0 ? `@${tags.join(",")}` : "";
	const key = `${baseKey}${tagSuffix}`;
	const pattern = `${namespace}:${identifier}*`;

	return { key, tags, pattern };
}

/**
 * Orders & Transactions Cache Keys
 */
export const OrderKeys = {
	/**
	 * List of orders for an organization
	 * Pattern: `orders:org:{orgId}`
	 * Tags: org
	 */
	list: (orgId: string): CacheKey =>
		buildKey("orders", `org:${orgId}`, undefined, ["org"]),

	/**
	 * Single order detail
	 * Pattern: `orders:detail:{orderId}`
	 * Tags: org, order
	 */
	detail: (orderId: string, orgId: string): CacheKey =>
		buildKey("orders", `detail:${orderId}`, undefined, ["org", "order"]),

	/**
	 * Order statistics for an organization
	 * Pattern: `orders:stats:{orgId}`
	 * Tags: org, stats
	 */
	stats: (orgId: string, period?: "day" | "week" | "month"): CacheKey =>
		buildKey("orders", `stats:${orgId}`, period, ["org", "stats"]),

	/**
	 * Orders by status
	 * Pattern: `orders:status:{orgId}:{status}`
	 * Tags: org, status
	 */
	byStatus: (orgId: string, status: string): CacheKey =>
		buildKey("orders", `status:${orgId}`, status, ["org", "status"]),
};

/**
 * Products & Inventory Cache Keys
 */
export const ProductKeys = {
	/**
	 * List of products for an organization
	 * Pattern: `products:org:{orgId}`
	 * Tags: org
	 */
	list: (orgId: string): CacheKey =>
		buildKey("products", `org:${orgId}`, undefined, ["org"]),

	/**
	 * Single product detail
	 * Pattern: `products:detail:{productId}`
	 * Tags: org, product
	 */
	detail: (productId: string, orgId: string): CacheKey =>
		buildKey("products", `detail:${productId}`, undefined, ["org", "product"]),

	/**
	 * Inventory count for a product
	 * Pattern: `products:inventory:{productId}`
	 * Tags: org, product, inventory
	 */
	inventory: (productId: string, orgId: string): CacheKey =>
		buildKey("products", `inventory:${productId}`, undefined, [
			"org",
			"product",
			"inventory",
		]),

	/**
	 * Stock alerts for an organization
	 * Pattern: `products:alerts:{orgId}`
	 * Tags: org, inventory
	 */
	alerts: (orgId: string): CacheKey =>
		buildKey("products", `alerts:${orgId}`, undefined, ["org", "inventory"]),

	/**
	 * Product by SKU
	 * Pattern: `products:sku:{sku}`
	 * Tags: org, product
	 */
	bySku: (sku: string, orgId: string): CacheKey =>
		buildKey("products", `sku:${sku}`, undefined, ["org", "product"]),
};

/**
 * Campaigns & Promotions Cache Keys
 */
export const CampaignKeys = {
	/**
	 * List of campaigns for an organization
	 * Pattern: `campaigns:org:{orgId}`
	 * Tags: org
	 */
	list: (orgId: string): CacheKey =>
		buildKey("campaigns", `org:${orgId}`, undefined, ["org"]),

	/**
	 * Single campaign detail
	 * Pattern: `campaigns:detail:{campaignId}`
	 * Tags: org, campaign
	 */
	detail: (campaignId: string, orgId: string): CacheKey =>
		buildKey("campaigns", `detail:${campaignId}`, undefined, [
			"org",
			"campaign",
		]),

	/**
	 * Campaign statistics
	 * Pattern: `campaigns:stats:{campaignId}`
	 * Tags: org, campaign, stats
	 */
	stats: (campaignId: string, orgId: string): CacheKey =>
		buildKey("campaigns", `stats:${campaignId}`, undefined, [
			"org",
			"campaign",
			"stats",
		]),

	/**
	 * Promo code lookup
	 * Pattern: `campaigns:promo:{code}`
	 * Tags: org, campaign, promo
	 */
	promoCode: (code: string, orgId: string): CacheKey =>
		buildKey("campaigns", `promo:${code}`, undefined, [
			"org",
			"campaign",
			"promo",
		]),

	/**
	 * Campaign profitability check
	 * Pattern: `campaigns:profit:{campaignId}`
	 * Tags: org, campaign, profit
	 */
	profitCheck: (campaignId: string, orgId: string): CacheKey =>
		buildKey("campaigns", `profit:${campaignId}`, undefined, [
			"org",
			"campaign",
			"profit",
		]),
};

/**
 * Users & Organizations Cache Keys
 */
export const UserKeys = {
	/**
	 * User profile
	 * Pattern: `users:profile:{userId}`
	 * Tags: user
	 */
	profile: (userId: string): CacheKey =>
		buildKey("users", `profile:${userId}`, undefined, ["user"]),

	/**
	 * User permissions
	 * Pattern: `users:permissions:{userId}`
	 * Tags: user, auth
	 */
	permissions: (userId: string, orgId: string): CacheKey =>
		buildKey("users", `permissions:${userId}`, orgId, ["user", "auth"]),

	/**
	 * Organization settings
	 * Pattern: `orgs:settings:{orgId}`
	 * Tags: org, settings
	 */
	orgSettings: (orgId: string): CacheKey =>
		buildKey("orgs", `settings:${orgId}`, undefined, ["org", "settings"]),

	/**
	 * Team members for an organization
	 * Pattern: `orgs:members:{orgId}`
	 * Tags: org, members
	 */
	teamMembers: (orgId: string): CacheKey =>
		buildKey("orgs", `members:${orgId}`, undefined, ["org", "members"]),
};

/**
 * Analytics & Reports Cache Keys
 */
export const AnalyticsKeys = {
	/**
	 * Dashboard statistics
	 * Pattern: `analytics:dashboard:{orgId}`
	 * Tags: org, stats, dashboard
	 */
	dashboard: (orgId: string, period?: string): CacheKey =>
		buildKey("analytics", `dashboard:${orgId}`, period, [
			"org",
			"stats",
			"dashboard",
		]),

	/**
	 * Daily report
	 * Pattern: `analytics:daily:{orgId}:{date}`
	 * Tags: org, report
	 */
	dailyReport: (orgId: string, date: string): CacheKey =>
		buildKey("analytics", `daily:${orgId}`, date, ["org", "report"]),

	/**
	 * Monthly report
	 * Pattern: `analytics:monthly:{orgId}:{month}`
	 * Tags: org, report
	 */
	monthlyReport: (orgId: string, month: string): CacheKey =>
		buildKey("analytics", `monthly:${orgId}`, month, ["org", "report"]),
};

/**
 * External API Cache Keys (Saleor, etc.)
 */
export const ExternalKeys = {
	/**
	 * Saleor product data
	 * Pattern: `saleor:product:{saleorId}`
	 * Tags: external, saleor, product
	 */
	saleorProduct: (saleorId: string): CacheKey =>
		buildKey("saleor", `product:${saleorId}`, undefined, [
			"external",
			"saleor",
			"product",
		]),

	/**
	 * Saleor channel data
	 * Pattern: `saleor:channel:{channelId}`
	 * Tags: external, saleor, channel
	 */
	saleorChannel: (channelId: string): CacheKey =>
		buildKey("saleor", `channel:${channelId}`, undefined, [
			"external",
			"saleor",
			"channel",
		]),

	/**
	 * Saleor voucher data
	 * Pattern: `saleor:voucher:{voucherId}`
	 * Tags: external, saleor, voucher
	 */
	saleorVoucher: (voucherId: string): CacheKey =>
		buildKey("saleor", `voucher:${voucherId}`, undefined, [
			"external",
			"saleor",
			"voucher",
		]),
};

/**
 * Utility: Generate pattern for wildcard matching
 *
 * @example
 * ```ts
 * const pattern = pattern('orders', 'org:123') // 'orders:org:123*'
 * ```
 */
export function pattern(namespace: string, identifier?: string): string {
	if (!identifier) return `${namespace}:*`;
	return `${namespace}:${identifier}*`;
}

/**
 * Utility: Generate tag pattern for invalidation
 *
 * @example
 * ```ts
 * const tagged = tagPattern('org') // Find all keys with @org tag
 * ```
 */
export function tagPattern(tag: string): string {
	return `*@*${tag}*`;
}

/**
 * All cache key builders organized by domain
 */
export const CacheKeys = {
	orders: OrderKeys,
	products: ProductKeys,
	campaigns: CampaignKeys,
	users: UserKeys,
	analytics: AnalyticsKeys,
	external: ExternalKeys,
	pattern,
	tagPattern,
};
