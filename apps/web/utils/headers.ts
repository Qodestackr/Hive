import { headers as nextHeaders } from "next/headers";
import isServerLike from "./is-server";

export async function getStandardHeaders(): Promise<Headers | null> {
    if (!isServerLike) {
        return null; // client, we can't access headers
    }
    const nextHeadersList = await nextHeaders();
    const standardHeaders = new Headers();

    // Explicitly forward the cookie header for session identification
    const cookie = nextHeadersList.get("cookie");
    if (cookie) {
        standardHeaders.set("cookie", cookie);
    }

    // Optionally forward other headers
    return standardHeaders;
}
