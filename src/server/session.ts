import "server-only";
import { headers } from "next/headers";
import { auth, type Session } from "@/server/auth";

/**
 * The session behind the current page request, checked against the
 * database (a cookie alone may be stale). Null when signed out, and also
 * when the check itself fails, so a page that only uses it to redirect
 * still renders.
 */
export async function currentSession(): Promise<Session | null> {
  try {
    return await auth().api.getSession({ headers: await headers() });
  } catch (error) {
    console.error("[auth] couldn't check the session", error);
    return null;
  }
}
