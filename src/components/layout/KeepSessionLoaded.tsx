"use client";

import { useSession } from "@/lib/auth-client";

/**
 * Keeps Better Auth's session store in use on pages without the header (the
 * sign-in pages). Once nothing uses it, the store checks the session again
 * when the header comes back, and for a signed-out visitor that blanks Sign
 * Up and Login until the check returns.
 */
export function KeepSessionLoaded() {
  useSession();
  return null;
}
