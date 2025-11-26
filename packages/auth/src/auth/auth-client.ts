import {
	adminClient,
	customSessionClient,
	inferAdditionalFields,
	multiSessionClient,
	oidcClient,
	organizationClient,
	twoFactorClient,
	// phoneNumberClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
// import { toast } from "@repo/ui/sonner"
import type { auth } from "./auth";
import { roles as backendRoles } from "./permissions";
import { reverifyClient } from "./reverify/client";

export const client = createAuthClient({
	plugins: [
		reverifyClient(),
		organizationClient({
			roles: {
				owner: backendRoles.owner,
				admin: backendRoles.admin,
				wholesaler: backendRoles.wholesaler,
				retailer: backendRoles.retailer,
				bartender: backendRoles.bartender,
				cashier: backendRoles.cashier,
				finance: backendRoles.finance,
				driver: backendRoles.driver,
			},
		}),
		twoFactorClient({
			onTwoFactorRedirect() {
				window.location.href = "/two-factor";
			},
		}),
		adminClient({
			roles: {
				owner: backendRoles.owner,
				admin: backendRoles.admin,
				wholesaler: backendRoles.wholesaler,
				retailer: backendRoles.retailer,
				bartender: backendRoles.bartender,
				cashier: backendRoles.cashier,
				finance: backendRoles.finance,
				driver: backendRoles.driver,
			},
		}),
		// phoneNumberClient(),
		multiSessionClient(),
		oidcClient(),
		// ✅ FIX 2: Use the auth instance instead of trying to reference the type
		inferAdditionalFields<typeof auth>({
			role: [
				"user",
				"retailer",
				"wholesaler",
				"distributor",
				"driver",
				"finance",
				"bartender",
			],
		}),
		// ✅ FIX 3: Same fix for customSessionClient
		customSessionClient<typeof auth>(),
	],
	fetchOptions: {
		onError(e) {
			if (e.error.status === 429) {
				// toast.error("Too many requests. Please try again later.");
			}
		},
	},
});

export const {
	signUp,
	signIn,
	signOut,
	useSession,
	organization,
	useListOrganizations,
	useActiveOrganization,
	admin,
	forgetPassword,
	$fetch,
	getSession,
	reverify,
} = client;

client.$store.listen("$sessionSignal", async () => {
	console.log("Session Signal Fired!");
});
