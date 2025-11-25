export { generateId as generateAuthId } from "better-auth"

export {
    signOut,
    useSession,
    signUp,
    signIn,
    client,
    forgetPassword,
    organization,
    useActiveOrganization,
    useListOrganizations,
    $fetch,
    admin,
    getSession,
} from './auth/auth-client'

export type {
    Session,
    ActiveOrganization
} from './auth/auth-types'
