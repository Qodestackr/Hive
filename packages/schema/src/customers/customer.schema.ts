import { z } from "zod";
import { ID, Timestamps } from "../shared/base.schema.js";
import { VerificationMethod } from "../shared/enums.schema.js";

export const CustomerSchema = z
	.object({
		id: z.string(),
		organizationId: z.string(),

		// Identity
		phoneNumber: z.string(), // E.164 format (+254...)
		name: z.string().nullable(),
		email: z.string().email().nullable(),

		// Age Verification (COMPLIANCE GOLD)
		isAgeVerified: z.boolean().default(false),
		ageVerificationMethod: VerificationMethod.nullable(),
		ageVerifiedAt: z.string().datetime().nullable(),
		dateOfBirth: z.string().datetime().nullable(),

		// Opt-in tracking (REGULATORY MOAT)
		hasOptedIn: z.boolean().default(false),
		optInSource: z.string().nullable(),
		optInCampaignId: z.string().nullable(),
		optedInAt: z.string().datetime().nullable(),
		optedOutAt: z.string().datetime().nullable(),

		// Segmentation
		tier: z.string().default("bronze"),
		totalSpend: z.number().nonnegative().default(0),
		totalOrders: z.number().int().nonnegative().default(0),
		lastOrderAt: z.string().datetime().nullable(),

		// Location (for geo-targeted campaigns)
		city: z.string().nullable(),
		coordinates: z
			.object({
				lat: z.number(),
				lng: z.number(),
			})
			.nullable(),

		// Metadata
		tags: z.array(z.string()).default([]),
		customFields: z.record(z.string(), z.any()).nullable(),
	})
	.merge(Timestamps)
	.openapi("Customer");

export const CustomerCreateSchema = z
	.object({
		phoneNumber: z
			.string()
			.regex(/^\+\d{10,15}$/, "Phone number must be in E.164 format (+254...)")
			.openapi({ example: "+254712345678" }),
		name: z.string().optional().openapi({ example: "John Doe" }),
		email: z
			.string()
			.email()
			.optional()
			.openapi({ example: "john@example.com" }),

		// Opt-in
		hasOptedIn: z.boolean().default(false),
		optInSource: z
			.string()
			.optional()
			.openapi({ example: "whatsapp_campaign" }),
		optInCampaignId: z.string().optional(),

		// Segmentation
		tier: z.enum(["bronze", "silver", "gold", "platinum"]).default("bronze"),
		city: z.string().optional().openapi({ example: "Nairobi" }),
		tags: z.array(z.string()).default([]),
		customFields: z.record(z.string(), z.any()).optional(),
	})
	.openapi("CustomerCreate");

export const CustomerUpdateSchema =
	CustomerCreateSchema.partial().openapi("CustomerUpdate");

// Customer age verification input
export const CustomerAgeVerificationSchema = z
	.object({
		verificationMethod: VerificationMethod,
		dateOfBirth: z.string().datetime().optional(),
		idDocumentUrl: z.string().url().optional(),
	})
	.openapi("CustomerAgeVerification");

// Customer opt-in input
export const CustomerOptInSchema = z
	.object({
		optInSource: z
			.string()
			.optional()
			.openapi({ example: "whatsapp_campaign" }),
		campaignId: z.string().optional(),
	})
	.openapi("CustomerOptIn");

// Customer opt-out input
export const CustomerOptOutSchema = z
	.object({
		reason: z.string().optional().openapi({ example: "No longer interested" }),
	})
	.openapi("CustomerOptOut");

// Customer list query params
export const CustomerListQuerySchema = z
	.object({
		page: z.coerce.number().int().positive().default(1),
		limit: z.coerce.number().int().positive().max(100).default(20),
		search: z.string().optional(), // Search by name, phone, email
		tier: z.string().optional(),
		hasOptedIn: z.coerce.boolean().optional(),
		isAgeVerified: z.coerce.boolean().optional(),
		city: z.string().optional(),
		tags: z.array(z.string()).optional(),
		minTotalSpend: z.coerce.number().nonnegative().optional(),
		lastOrderDaysAgo: z.coerce.number().int().nonnegative().optional(),
		sortBy: z
			.enum([
				"name",
				"phoneNumber",
				"totalSpend",
				"totalOrders",
				"createdAt",
				"lastOrderAt",
			])
			.default("createdAt"),
		sortOrder: z.enum(["asc", "desc"]).default("desc"),
	})
	.openapi("CustomerListQuery");

export const CustomerResponseSchema =
	CustomerSchema.openapi("CustomerResponse");

export const CustomerListResponseSchema = z
	.object({
		data: z.array(CustomerResponseSchema),
		pagination: z.object({
			page: z.number(),
			limit: z.number(),
			total: z.number(),
			totalPages: z.number(),
		}),
	})
	.openapi("CustomerListResponse");

export const CustomerStatsSchema = z
	.object({
		totalCustomers: z.number().int().nonnegative(),
		optedInCustomers: z.number().int().nonnegative(),
		ageVerifiedCustomers: z.number().int().nonnegative(),
		activeCustomers: z.number().int().nonnegative(), // Ordered in last 30 days

		customersByTier: z.record(z.string(), z.number().int().nonnegative()),
		customersByCity: z.record(z.string(), z.number().int().nonnegative()),

		totalLifetimeValue: z.number().nonnegative(),
		avgOrderValue: z.number().nonnegative(),
		avgOrdersPerCustomer: z.number().nonnegative(),
	})
	.openapi("CustomerStats");

export const BulkCustomerImportSchema = z
	.object({
		customers: z
			.array(CustomerCreateSchema)
			.min(1, "At least one customer is required")
			.max(1000, "Maximum 1000 customers per import"),
		skipDuplicates: z.boolean().default(true),
	})
	.openapi("BulkCustomerImport");

export const BulkCustomerImportResponseSchema = z
	.object({
		success: z.boolean(),
		imported: z.number().int().nonnegative(),
		skipped: z.number().int().nonnegative(),
		errors: z.array(
			z.object({
				index: z.number().int(),
				phoneNumber: z.string(),
				error: z.string(),
			}),
		),
	})
	.openapi("BulkCustomerImportResponse");

export type Customer = z.infer<typeof CustomerSchema>;
export type CustomerCreate = z.infer<typeof CustomerCreateSchema>;
export type CustomerUpdate = z.infer<typeof CustomerUpdateSchema>;
export type CustomerAgeVerification = z.infer<
	typeof CustomerAgeVerificationSchema
>;
export type CustomerOptIn = z.infer<typeof CustomerOptInSchema>;
export type CustomerOptOut = z.infer<typeof CustomerOptOutSchema>;
export type CustomerListQuery = z.infer<typeof CustomerListQuerySchema>;
export type CustomerResponse = z.infer<typeof CustomerResponseSchema>;
export type CustomerListResponse = z.infer<typeof CustomerListResponseSchema>;
export type CustomerStats = z.infer<typeof CustomerStatsSchema>;
export type BulkCustomerImport = z.infer<typeof BulkCustomerImportSchema>;
export type BulkCustomerImportResponse = z.infer<
	typeof BulkCustomerImportResponseSchema
>;
