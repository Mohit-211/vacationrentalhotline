import "server-only";
import { headers } from "next/headers";
import { CUSTOMER_ROLE } from "@/lib/permissions";
import { auth, type Session } from "@/server/auth";

/**
 * The customer signed in on the current page request, checked against the
 * database (a cookie alone may be stale). Null when signed out, for a staff
 * session (staff belong to the admin panel), and when the check itself
 * fails, so a page that only uses it to redirect still renders.
 */
export async function currentCustomer(): Promise<Session | null> {
  // Outside the try: reading the headers is how Next learns the page is
  // dynamic, and it signals that by throwing, which mustn't be caught.
  const requestHeaders = await headers();
  try {
    const session = await auth().api.getSession({ headers: requestHeaders });
    const role = (session?.user as { role?: string } | undefined)?.role ?? CUSTOMER_ROLE;
    return session && role === CUSTOMER_ROLE ? session : null;
  } catch (error) {
    console.error("[auth] couldn't check the session", error);
    return null;
  }
}
