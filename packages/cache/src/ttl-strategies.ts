export const TTL = {
    /**
    For highly volatile data. Real-time stats, live counters, temporary locks
    */
    REALTIME: 60,

    /**
    For frequently changing data. Dashboard stats, aggregated metrics, session data
     */
    SHORT: 300,

    /**
    For moderately stable data. User profiles, product details, campaign data
     */
    MEDIUM: 1800,

    /**
    For stable data. Organization data, settings, most list views
     */
    STANDARD: 3600,

    /**
    For rarely changing data. Static configurations, system settings, templates
     */
    LONG: 21600,

    /**
     * Use for: Historical reports, archived data, static assets
     */
    EXTENDED: 86400,

    /**
     * Week-long TTL for nearly immutable data (7 days)
     * Use for: Completed reports, finalized calculations, audit logs
     */
    WEEK: 604800,
} as const

/**
 * Domain-specific TTL configurations
 * Maps business domains to appropriate TTL values
 */
export const DOMAIN_TTL = {
    // Orders & Transactions
    ORDER_LIST: TTL.STANDARD,
    ORDER_DETAIL: TTL.MEDIUM,
    ORDER_STATS: TTL.SHORT,

    // Products & Inventory
    PRODUCT_LIST: TTL.STANDARD,
    PRODUCT_DETAIL: TTL.LONG,
    INVENTORY_COUNT: TTL.MEDIUM,
    STOCK_ALERTS: TTL.SHORT,

    // Campaigns & Promotions
    CAMPAIGN_LIST: TTL.STANDARD,
    CAMPAIGN_DETAIL: TTL.MEDIUM,
    CAMPAIGN_STATS: TTL.SHORT,
    PROMO_CODE: TTL.MEDIUM,

    // Users & Organizations
    USER_PROFILE: TTL.MEDIUM,
    ORG_SETTINGS: TTL.LONG,
    TEAM_MEMBERS: TTL.STANDARD,
    PERMISSIONS: TTL.MEDIUM,

    // Analytics & Reports
    DASHBOARD_STATS: TTL.SHORT,
    DAILY_REPORT: TTL.EXTENDED,
    MONTHLY_REPORT: TTL.WEEK,

    // External APIs (Saleor, etc.)
    SALEOR_PRODUCT: TTL.STANDARD,
    SALEOR_CHANNEL: TTL.LONG,
    SALEOR_VOUCHER: TTL.MEDIUM,
} as const

/**
 * Calculate dynamic TTL based on data characteristics
 * 
 * @param baseMultiplier - Base multiplier for calculation (default: 1)
 * @returns TTL in seconds
 * 
 * @example
 * ```ts
 * // Cache hot data for shorter periods
 * const ttl = calculateDynamicTTL(0.5) // 30 minutes
 * 
 * // Cache cold data for longer periods
 * const ttl = calculateDynamicTTL(2) // 2 hours
 * ```
 */
export function calculateDynamicTTL(baseMultiplier: number = 1): number {
    return Math.floor(TTL.STANDARD * baseMultiplier)
}

/**
 * Get TTL based on time of day (cache longer during off-hours)
 * 
 * @returns TTL in seconds, adjusted for current time
 * 
 * @example
 * ```ts
 * const ttl = getTimeBasedTTL() // Longer TTL at night, shorter during business hours
 * ```
 */
export function getTimeBasedTTL(): number {
    const hour = new Date().getHours()

    // Business hours (9 AM - 5 PM): shorter TTL for fresher data
    if (hour >= 9 && hour < 17) {
        return TTL.MEDIUM
    }

    // Off-hours: longer TTL to reduce load
    return TTL.LONG
}

/**
 * Calculate TTL based on data age
 * Older data can be cached longer as it's less likely to change
 * 
 * @param createdAt - When the data was created
 * @returns TTL in seconds
 * 
 * @example
 * ```ts
 * const orderDate = new Date('2024-01-01')
 * const ttl = getAgeBasedTTL(orderDate) // Longer TTL for old orders
 * ```
 */
export function getAgeBasedTTL(createdAt: Date): number {
    const ageInDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)

    if (ageInDays < 1) {
        return TTL.SHORT // Recent data changes frequently
    } else if (ageInDays < 7) {
        return TTL.STANDARD // Week-old data is more stable
    } else if (ageInDays < 30) {
        return TTL.LONG // Month-old data rarely changes
    } else {
        return TTL.EXTENDED // Old data is essentially immutable
    }
}

export type TTLValue = number

export type TTLStrategy = () => number