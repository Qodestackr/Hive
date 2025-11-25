import { getStandardHeaders } from "./headers"

export async function getSafeSession() {
  const standardHeaders = new Headers()
  try {
    const nextHeadersList = await getStandardHeaders()
    if (nextHeadersList) {
      const cookie = nextHeadersList.get("cookie")
      if (cookie) {
        standardHeaders.set("cookie", cookie)
      }
    }

    const { auth } = await import("@repo/auth")

    const session = await Promise.race([
      auth.api.getSession({ headers: standardHeaders }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Session timeout")), 5000)),
    ]) as typeof auth.$Infer.Session | null

    return { session, headers: standardHeaders }
  } catch (err) {
    console.warn("[getSafeSession] error:", err)
    return { session: null, headers: standardHeaders }
  }
}
