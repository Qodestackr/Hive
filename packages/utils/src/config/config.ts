import { env, features, isProduction, validateEnvironment } from "./env";
import { API_ENDPOINTS, APP_BASE_URL } from "./urls";

// Application-wide configuration
export const appConfig = {
	// App metadata
	name: "Promco Platform",
	version: "1.0.0",
	description: "B2B Liquor Platform with POS, Analytics, and BNPL",

	// URLs
	baseUrl: APP_BASE_URL,
	apiUrl: API_ENDPOINTS,

	// Environment
	environment: env.NODE_ENV,
	isProduction,

	// Features
	features,

	// Database
	database: {
		url: env.DATABASE_URL,
		maxConnections: 10,
		connectionTimeout: 30000,
	},

	// Authentication
	auth: {
		sessionDuration: 30 * 24 * 60 * 60, // 30 days in seconds
		refreshTokenDuration: 90 * 24 * 60 * 60, // 90 days in seconds
		passwordMinLength: 8,
		maxLoginAttempts: 5,
		lockoutDuration: 15 * 60, // 15 minutes in seconds
	},

	// File uploads
	uploads: {
		maxFileSize: 10 * 1024 * 1024, // 10MB
		allowedImageTypes: ["image/jpeg", "image/png", "image/webp"],
		allowedDocumentTypes: ["application/pdf", "image/jpeg", "image/png"],
	},

	// Pagination
	pagination: {
		defaultLimit: 20,
		maxLimit: 100,
	},

	// Cache settings
	cache: {
		defaultTtl: 60 * 60, // 1 hour in seconds
		shortTtl: 5 * 60, // 5 minutes
		longTtl: 24 * 60 * 60, // 24 hours
	},

	// Rate limiting
	rateLimit: {
		windowMs: 15 * 60 * 1000, // 15 minutes
		maxRequests: 100,
		skipSuccessfulRequests: false,
	},

	// Business logic
	business: {
		// Loyalty points
		loyaltyPointsPerKES: 1, // 1 point per KES spent
		loyaltyRedemptionRate: 0.01, // 1 point = 0.01 KES

		// BNPL settings
		bnplMaxAmount: 100000, // KES 100,000
		bnplDefaultTerm: 30, // 30 days
		bnplInterestRate: 0.05, // 5% monthly

		// Inventory
		lowStockThreshold: 10,
		criticalStockThreshold: 5,

		// Delivery
		deliveryRadius: 50, // 50km radius
		deliveryFee: 200, // KES 200 base delivery fee
		freeDeliveryThreshold: 5000, // Free delivery above KES 5,000

		//////////
		defaultMarginRate: 0.2, // 20% default markup (i.e. buy @ 100 → sell @ 120)
		// brandMarginOverrides: {
		//     "Kenya Cane": 0.05,       // 5% markup
		//     "Glenfiddich": 0.5,       // 50% markup
		//     "Johnnie Walker": 0.35,   // 35% markup
		// },
		categoryMarginOverrides: {
			Beer: 0.1, // 10%
			Whisky: 0.4, // 40%
			"Soft Drinks": 0.15,
		},
		minimumMarginRate: 0.05, // 5%
	},

	// Notification settings
	notifications: {
		email: {
			from: "online@promco.co",
			replyTo: "support@promco.co",
		},
		sms: {
			enabled: true,
			provider: "africastalking",
		},
		push: {
			enabled: true,
			vapidPublicKey: env.VAPID_PUBLIC_KEY,
		},
	},

	// Analytics
	analytics: {
		trackingEnabled: features.analytics,
		sessionTimeout: 30 * 60, // 30 minutes
		batchSize: 100,
		flushInterval: 10000, // 10 seconds
	},
};

// Initialize and validate configuration
export function initializeConfig(): void {
	try {
		validateEnvironment();
		console.log(`🚀 ${appConfig.name} v${appConfig.version} initialized`);
		console.log(`📍 Environment: ${appConfig.environment}`);
		console.log(`🌐 Base URL: ${appConfig.baseUrl}`);
		console.log(
			`✨ Features: ${Object.entries(features)
				.filter(([, enabled]) => enabled)
				.map(([name]) => name)
				.join(", ")}`,
		);
	} catch (error) {
		console.error("❌ Configuration initialization failed:", error);
		process.exit(1);
	}
}

export { env, validateEnvironment, features, isProduction };
