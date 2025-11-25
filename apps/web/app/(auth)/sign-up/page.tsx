import { SignUp } from "@/components/auth/sign-up";
import { AuthRedirect } from "@/components/auth/auth-redirect";
import { getServerSession } from "@/app/auth-server";
import { headers } from "next/headers";

export default async function Page() {
    const hdrs = await headers();
    const session = await getServerSession(hdrs);

    return (
        <AuthRedirect session={session}>
            <div className="max-w-4xl mx-auto">
                <SignUp />
            </div>
        </AuthRedirect>
    );
}
