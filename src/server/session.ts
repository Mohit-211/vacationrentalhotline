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
  // Outside the try: reading the headers is how Next learns the page is
  // dynamic, and it signals that by throwing, which mustn't be caught.
  const requestHeaders = await headers();
  try {
    return await auth().api.getSession({ headers: requestHeaders });
  } catch (error) {
    console.error("[auth] couldn't check the session", error);
    return null;
  }
}
