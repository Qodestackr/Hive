import type { paths } from "@repo/schema/generated/openapi";
import createClient from "openapi-fetch";

export const api = createClient<paths>({
	baseUrl: process.env.NEXT_PUBLIC_API_URL || "",
});

// Configure auth token for authenticated requests. Call this after user login
export function setAuthToken(token: string) {
	api.use({
		onRequest({ request }) {
			request.headers.set("Authorization", `Bearer ${token}`);
			return request;
		},
	});
}

// Clear auth token (e.g., on logout)
export function clearAuthToken() {
	// openapi-fetch doesn't have a direct "remove middleware" API
	// So we recreate the client without auth
	// Alternative: use a flag-based middleware
}
