import db from "@repo/db";
import { generateId } from "@repo/utils";
import { type BetterAuthOptions, betterAuth, logger } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import {
	admin as adminPlugin,
	multiSession,
	openAPI,
	organization,
	phoneNumber,
} from "better-auth/plugins";
import { ac, roles } from "./permissions";
import { reverify } from "./reverify";

const ALLOWED_ROLES = [
	"retailer",
	"wholesaler",
	"distributor",
	"user",
	"driver",
	"brand_owner",
] as const;

const AUTH_CONFIG = {
	trustedOrigins: [
		"http://localhost:3000",
		"http://46.202.130.243:3000",
		"http://46.202.130.243:7700",
		"http://46.202.130.243:8000",
		"https://commerce.alcorabooks.com",
		"https://search.alcorabooks.com",
		"https://alcorabooks.com",
		"alcorabooks.com",
		"https://www.alcorabooks.com",
	],
	appName: "Alcorabooks",
	allowedRoles: ALLOWED_ROLES,
};

// ✅ CORRECT: Direct export with inline config - NO wrapper functions
export const auth = betterAuth({
	trustedOrigins: AUTH_CONFIG.trustedOrigins,
	appName: AUTH_CONFIG.appName,
	secret:
		process.env.BETTER_AUTH_SECRET ||
		"0c06fd6be5b8109d7e13630f5e7cabbe6de3ac8b2bb00d437805df9c4743b924",
	database: drizzleAdapter(db, {
		provider: "pg",
	}),
	logger: {
		level: "debug",
	},
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false,
		minPasswordLength: 8,
		maxPasswordLength: 128,
		autoSignIn: true,
		sendResetPassword: async ({ user, url, token }, request) => {},
		onPasswordReset: async ({ user }, request) => {},
	},
	emailVerification: {
		sendVerificationEmail: async ({ user, url, token }) => {
			logger.info(`✅ Welcome + verification emails sent to ${user.email}`);
		},
		sendOnSignUp: true,
		autoSignInAfterVerification: true,
		expiresIn: 3600, // 1 hour
	},
	user: {
		additionalFields: {
			role: {
				type: "string",
				required: true,
				defaultValue: "user",
				input: true,
			},
			// Track the original business type selection (including "staff")
			businessType: {
				type: "string",
				required: false,
				input: true,
			},
			premium: {
				type: "boolean",
				required: false,
				defaultValue: false,
				input: false,
			},
			// Phone number for SMS notifications not from better-auth auth plugins
			// @ref https://www.better-auth.com/docs/plugins/phone-number
			phoneNumber: {
				type: "string",
				required: false,
				input: true,
			},
			enableSMS: {
				type: "boolean",
				required: false,
				defaultValue: true,
				input: true,
			},
		},
	},
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 60 * 60 * 24 * 7,
		},
		expiresIn: 60 * 60 * 24 * 7,
		updateAge: 60 * 60 * 24,
		additionalFields: {
			saleorChannelId: { type: "string", required: false },
			saleorChannelSlug: { type: "string", required: false },
			organizationId: { type: "string", required: false },
			activeOrganizationId: { type: "string", required: false },
			organizationName: { type: "string", required: false },
			organizationSlug: { type: "string", required: false },
			businessType: { type: "string", required: false },
			warehouseId: { type: "string", required: false },
		},
	},
	databaseHooks: {
		user: {
			create: {},
		},
		session: {
			create: {
				before: async (session, ctx) => {},
				after: async (session, ctx) => {},
			},
		},
	},
	socialProviders: {
		google: {
			clientId:
				"644434745663-s4idvq7qp0jjqth81me4drpdofkdm7d3.apps.googleusercontent.com",
			clientSecret: "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",
			accessType: "offline",
		},
	},
	plugins: [
		adminPlugin({
			ac: ac,
			roles,
			adminRoles: ["owner", "admin"],
			impersonationSessionDuration: 60 * 60 * 24 * 7,
		}),
		openAPI(),
		multiSession(),
		nextCookies(),
		phoneNumber({
			allowedAttempts: 3,
			sendOTP: async ({ phoneNumber, code }, request) => {
				console.log(`Sending OTP ${code} to ${phoneNumber}`);
			},
			signUpOnVerification: {
				getTempEmail: (phoneNumber) => {
					return `${phoneNumber}@alcorabooks.com`;
				},
				getTempName: (phoneNumber) => {
					return phoneNumber;
				},
			},
			callbackOnVerification: async ({ phoneNumber, user }, request) => {
				// After successful verification
				if (user) {
					console.log(`Login successful for ${phoneNumber}`);
					// Update last login or any other login logic
				}
			},
			otpLength: 4,
			expiresIn: 60 * 5, //5mins
		}),
		organization({
			allowUserToCreateOrganization: true,
			membershipLimit: 200_0,
			organizationLimit: 10,
			cancelPendingInvitationsOnReInvite: true,
			requireEmailVerificationOnInvitation: false,
			ac: ac,
			roles: {
				owner: roles.owner,
				admin: roles.admin,
				wholesaler: roles.wholesaler,
				retailer: roles.retailer,
				bartender: roles.bartender,
				cashier: roles.cashier,
				finance: roles.finance,
				driver: roles.driver,
			},
			async sendInvitationEmail(data) {
				try {
					// await emailService.sendUserInviteEmail({
					//   email: data.email,
					//   inviterName: data.inviter.user.name || 'Someone',
					//   inviteeName: data.email.split('@')[0] || data.email,
					//   organizationName: data.organization.name,
					//   role: Array.isArray(data.role) ? data.role.join(', ') : data.role,
					//   inviteToken: data.id,
					//   expiresIn: '48 hours', // TODO: calc from data.expiresAt
					// });

					logger.info(
						`✅ Invitation email sent to ${data.email} for organization ${data.organization.name}`,
					);
				} catch (error) {
					logger.error(
						`❌ Failed to send invitation email to ${data.email}:`,
						error,
					);
					throw error; // Re-throw: Better Auth to handle the err
				}
			},
			schema: {
				organization: {
					fields: {
						// Define how organization.metadata maps to our custom fields
						metadata: "metadata",
					},
					additionalFields: {
						businessType: {
							type: "string",
							required: false,
							defaultValue: "",
						},
						description: {
							type: "string",
							required: false,
						},
						logo: {
							type: "string",
							required: false,
						},
						city: {
							type: "string",
							required: false,
						},
						address: {
							type: "string",
							required: false,
						},
						phoneNumber: {
							type: "string",
							required: false,
						},
						enableSMS: {
							type: "boolean",
							required: false,
							defaultValue: true,
						},
						paymentMethod: {
							type: "string",
							required: false,
						},
						subscriptionPlan: {
							type: "string",
							required: false,
						},
						onboardingComplete: {
							type: "boolean",
							required: false,
							defaultValue: false,
						},
						channel: {
							type: "string",
							required: false,
							defaultValue: true,
						},
					},
				},
			},
			organizationCreation: {
				beforeCreate: async ({ organization, user }) => {
					console.log("Inside organizationCreation.beforeCreate", organization);
					const extendedOrg = {
						...organization,
						slug: organization.slug || generateId(),
					};
					console.log("ext-org.user", extendedOrg, user, user.id);
					return {
						data: extendedOrg,
					};
				},
				afterCreate: async ({ organization, user }) => {
					console.log("Inside organizationCreation.beforeCreate", organization);
					// TODO: Attach Saleor resources
					console.log(organization, "afterCreate", user);
				},
			},
		}),
		reverify(),
	] as const,
});

export type Auth = typeof auth;
