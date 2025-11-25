interface EnvConfig {
    NODE_ENV: string;
    DATABASE_URL: string;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    MICROSOFT_CLIENT_ID?: string;
    MICROSOFT_CLIENT_SECRET?: string;
    FACEBOOK_CLIENT_ID?: string;
    FACEBOOK_CLIENT_SECRET?: string;
    SALEOR_API_URL: string;
    SALEOR_WEBHOOK_SECRET?: string;
    SALEOR_APP_TOKEN?: string;
    SALEOR_B2B_ALLOW_UNPAID_ORDERS?: string;
    SALEOR_MANUAL_PAYMENT_GATEWAY_ID?: string;
    B2B_PAYMENT_TERMS_DAYS?: string;
    POSTHOG_KEY?: string;
    POSTHOG_HOST?: string;
    VERCEL_ANALYTICS_ID?: string;
    MPESA_CONSUMER_KEY?: string;
    MPESA_CONSUMER_SECRET?: string;
    MPESA_PASSKEY?: string;
    MPESA_SHORTCODE?: string;
    UPLOADTHING_SECRET?: string;
    UPLOADTHING_APP_ID?: string;
    AWS_ACCESS_KEY_ID?: string;
    AWS_SECRET_ACCESS_KEY?: string;
    AWS_REGION?: string;
    AWS_BUCKET_NAME?: string;
    RESEND_API_KEY?: string;
    SMTP_HOST?: string;
    SMTP_PORT?: string;
    SMTP_USER?: string;
    SMTP_PASS?: string;
    MEILISEARCH_HOST?: string;
    MEILISEARCH_API_KEY?: string;
    CLICKHOUSE_HOST?: string;
    CLICKHOUSE_PORT?: string;
    CLICKHOUSE_USERNAME?: string;
    CLICKHOUSE_PASSWORD?: string;
    CLICKHOUSE_DATABASE?: string;
    QUICKBOOKS_CLIENT_ID?: string;
    QUICKBOOKS_CLIENT_SECRET?: string;
    QUICKBOOKS_REDIRECT_URI?: string;
    VAPID_PUBLIC_KEY?: string;
    REDIS_URL?: string;
    REDIS_TOKEN?: string;
    WEBHOOK_SECRET?: string;
    AFRICASTALKING_USERNAME?: string;
    AFRICASTALKING_API_KEY?: string;
    FIREBASE_SERVICE_ACCOUNT_KEY?: string;
    ENABLE_ANALYTICS?: string;
    ENABLE_LOYALTY?: string;
    ENABLE_BNPL?: string;
    TEST_EMAIL?: string;
    DEBUG_MODE?: string;
}

function getEnvVar(key: string, fallback?: string): string {
    const value = process.env[key] || fallback;
    return value || "";
}

function getBooleanEnv(key: string, fallback = false): boolean {
    const value = process.env[key];
    if (!value) return fallback;
    return value.toLowerCase() === "true" || value === "1";
}

function getNumberEnv(key: string, fallback?: number): number {
    const value = process.env[key];
    if (!value) {
        if (fallback !== undefined) return fallback;
        throw new Error(`Missing env: ${key}`);
    }
    const parsed = Number.parseInt(value, 10);
    if (isNaN(parsed)) {
        throw new Error(`Invalid number for env: ${key}`);
    }
    return parsed;
}

const DISABLE_ENV_CHECKS = process.env.DISABLE_ENV_CHECKS === "true"; // or hardcode `true`

export const env: EnvConfig = new Proxy({} as EnvConfig, {
    get(_, key: string) {
        const val = process.env[key];

        // if (!val && !DISABLE_ENV_CHECKS) {
        //     if (["DATABASE_URL", "BETTER_AUTH_SECRET"].includes(key)) {
        //         if (process.env.NODE_ENV === "production") {
        //             console.warn(`Missing required env: ${key}`);
        //             // throw new Error
        //         } else {
        //             console.warn(`⚠️ Missing dev env: ${key}`);
        //         }
        //     }
        // }

        return val ?? "";
    },
});

// export const env: EnvConfig = new Proxy({} as EnvConfig, {
//     get(_, key: string) {
//         const val = process.env[key];
//         if (!val && ["DATABASE_URL", "BETTER_AUTH_SECRET"].includes(key)) {
//             if (process.env.NODE_ENV === "production") {
//                 throw new Error(`Missing required env: ${key}`);
//             } else {
//                 console.warn(`⚠️ Missing dev env: ${key}`);
//             }
//         }
//         return val ?? "";
//     }
// });

export const isProduction = env.NODE_ENV === "production";
export const isDevelopment = env.NODE_ENV === "development";
export const isTest = env.NODE_ENV === "test";

export const features = {
    analytics: getBooleanEnv("ENABLE_ANALYTICS", true),
    loyalty: getBooleanEnv("ENABLE_LOYALTY", true),
    bnpl: getBooleanEnv("ENABLE_BNPL", true),
    debug: getBooleanEnv("DEBUG_MODE", false),
};

export const database = {
    url: env.DATABASE_URL,
    maxConnections: getNumberEnv("DB_MAX_CONNECTIONS", 10),
    connectionTimeout: getNumberEnv("DB_CONNECTION_TIMEOUT", 30000),
};

export const auth = {
    secret: env.BETTER_AUTH_SECRET,
    url: env.BETTER_AUTH_URL,
    providers: {
        google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
        microsoft: {
            clientId: env.MICROSOFT_CLIENT_ID,
            clientSecret: env.MICROSOFT_CLIENT_SECRET,
        },
        facebook: {
            clientId: env.FACEBOOK_CLIENT_ID,
            clientSecret: env.FACEBOOK_CLIENT_SECRET,
        },
    },
};

export const saleor = {
    apiUrl: env.SALEOR_API_URL,
    webhookSecret: env.SALEOR_WEBHOOK_SECRET,
    appToken: env.SALEOR_APP_TOKEN,
    b2b: {
        allowUnpaidOrders: getBooleanEnv("SALEOR_B2B_ALLOW_UNPAID_ORDERS", true),
        manualPaymentGatewayId: env.SALEOR_MANUAL_PAYMENT_GATEWAY_ID || "manual",
        paymentTermsDays: getNumberEnv("B2B_PAYMENT_TERMS_DAYS", 30),
    },
};

export const payments = {
    mpesa: {
        consumerKey: env.MPESA_CONSUMER_KEY,
        consumerSecret: env.MPESA_CONSUMER_SECRET,
        passkey: env.MPESA_PASSKEY,
        shortcode: env.MPESA_SHORTCODE,
    },
};

export const analytics = {
    posthog: {
        key: env.POSTHOG_KEY,
        host: env.POSTHOG_HOST,
    },
    clickhouse: {
        host: env.CLICKHOUSE_HOST,
        port: getNumberEnv("CLICKHOUSE_PORT", 8123),
        username: env.CLICKHOUSE_USERNAME,
        password: env.CLICKHOUSE_PASSWORD,
        database: env.CLICKHOUSE_DATABASE,
    },
};

export function validateEnvironment(): void {
    const requiredVars = ["DATABASE_URL", "BETTER_AUTH_SECRET"]

    const missing = requiredVars.filter((varName) => !process.env[varName])

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missing.join(", ")}\n` +
            "Please check your .env file and ensure all required variables are set.",
        )
    }

    console.log("✅ Environment validation passed")
}

export { env as default };