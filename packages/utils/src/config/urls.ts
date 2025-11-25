import { env, isProduction } from "./env"

export const APP_BASE_URL = "https://promco.co"

export const APP_BASE_API_URL = `${APP_BASE_URL}/api`

export const APP_COMMERCE_URL = "https://commerce.promco.co"
//"https://store-dvup9a9c.saleor.cloud" //"http://46.202.130.243:8000"

export const MEILISEARCH_URL = "https://search.promco.co"

export const POSTHOG_URL = env.POSTHOG_HOST || "https://us.i.posthog.com"

export const API_ENDPOINTS = {
    auth: {
        login: `${APP_BASE_API_URL}/auth/login`,
        logout: `${APP_BASE_API_URL}/auth/logout`,
        register: `${APP_BASE_API_URL}/auth/register`,
        refresh: `${APP_BASE_API_URL}/auth/refresh`,
    },
    saleor: {
        token: `${APP_BASE_API_URL}/saleor/token`,
        webhook: `${APP_BASE_API_URL}/saleor/webhook`,
        products: `${APP_BASE_API_URL}/saleor/products`,
        orders: `${APP_BASE_API_URL}/saleor/orders`,
    },
    payments: {
        mpesa: {
            token: `${APP_BASE_API_URL}/mpesa/token`,
            stkPush: `${APP_BASE_API_URL}/mpesa/stk-push`,
            callback: `${APP_BASE_API_URL}/mpesa/callback`,
        }
    },
    loyalty: {
        points: `${APP_BASE_API_URL}/loyalty/points`,
        redeem: `${APP_BASE_API_URL}/loyalty/redeem`,
        history: `${APP_BASE_API_URL}/loyalty/history`,
    },
    accounting: {
        budgets: `${APP_BASE_API_URL}/accounting/budgets`,
        scenarios: `${APP_BASE_API_URL}/accounting/budgets/scenarios`,
        compare: `${APP_BASE_API_URL}/accounting/budgets/scenarios/compare`,
        expenses: `${APP_BASE_API_URL}/accounting/expenses`,
        vendors: `${APP_BASE_API_URL}/accounting/vendors`,
        reports: `${APP_BASE_API_URL}/accounting/reports`,
    },
    inventory: {
        items: `${APP_BASE_API_URL}/inventory/items`,
        audit: `${APP_BASE_API_URL}/inventory/audit`,
        stock: `${APP_BASE_API_URL}/inventory/stock`,
        warehouses: `${APP_BASE_API_URL}/inventory/warehouses`,
    },
    pos: {
        transactions: `${APP_BASE_API_URL}/pos/transactions`,
        tills: `${APP_BASE_API_URL}/pos/tills`,
        products: `${APP_BASE_API_URL}/pos/products`,
        reports: `${APP_BASE_API_URL}/pos/reports`,
    },
    customers: {
        list: `${APP_BASE_API_URL}/customers`,
        create: `${APP_BASE_API_URL}/customers`,
        loyalty: `${APP_BASE_API_URL}/customers/loyalty`,
    },
    analytics: {
        dashboard: `${APP_BASE_API_URL}/analytics/dashboard`,
        sales: `${APP_BASE_API_URL}/analytics/sales`,
        inventory: `${APP_BASE_API_URL}/analytics/inventory`,
        customers: `${APP_BASE_API_URL}/analytics/customers`,
    },
    delivery: {
        routes: `${APP_BASE_API_URL}/delivery/routes`,
        drivers: `${APP_BASE_API_URL}/delivery/drivers`,
        tracking: `${APP_BASE_API_URL}/delivery/tracking`,
    },
    relationships: {
        connections: `${APP_BASE_API_URL}/relationships/connections`,
        requests: `${APP_BASE_API_URL}/relationships/requests`,
        permissions: `${APP_BASE_API_URL}/relationships/permissions`,
    },
    upload: {
        documents: `${APP_BASE_API_URL}/upload/documents`,
        images: `${APP_BASE_API_URL}/upload/images`,
        receipts: `${APP_BASE_API_URL}/upload/receipts`,
    },
    webhooks: {
        saleor: `${APP_BASE_API_URL}/webhooks/saleor`,
        stripe: `${APP_BASE_API_URL}/webhooks/stripe`,
        mpesa: `${APP_BASE_API_URL}/webhooks/mpesa`,
    },
}

export const APP_MPESA_API_TOKEN_URL = API_ENDPOINTS.payments.mpesa.token
export const COMMERCE_TOKEN_ENDPOINT = API_ENDPOINTS.saleor.token
export const LOYALTY = API_ENDPOINTS.loyalty.points
export const ACCOUNTING_URLs = API_ENDPOINTS.accounting

export function buildUrl(baseUrl: string, params?: Record<string, string | number | boolean>): string {
    if (!params) return baseUrl

    const url = new URL(baseUrl)
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value))
    })

    return url.toString()
}

export function getOrgApiUrl(endpoint: string, orgId: string): string {
    return `${endpoint}?orgId=${orgId}`
}

export const WS_ENDPOINTS = {
    notifications: `${APP_BASE_URL.replace("http", "ws")}/ws/notifications`,
    pos: `${APP_BASE_URL.replace("http", "ws")}/ws/pos`,
    delivery: `${APP_BASE_URL.replace("http", "ws")}/ws/delivery`,
}

export const ASSET_URLS = {
    images: `${APP_BASE_URL}/images`,
    documents: `${APP_BASE_URL}/documents`,
    receipts: `${APP_BASE_URL}/receipts`,
    logos: `${APP_BASE_URL}/logos`,
}
