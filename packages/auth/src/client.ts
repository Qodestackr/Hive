export { generateId as generateAuthId } from "better-auth";

export {
	$fetch,
	admin,
	client,
	forgetPassword,
	getSession,
	organization,
	signIn,
	signOut,
	signUp,
	useActiveOrganization,
	useListOrganizations,
	useSession,
} from "./auth/auth-client";

export type {
	ActiveOrganization,
	Session,
} from "./auth/auth-types";
