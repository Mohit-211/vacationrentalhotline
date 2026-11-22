import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { AUTH_COOKIE_PREFIX } from "@/lib/auth-cookie";

/**
 * Signed-in pages send visitors without a session cookie to the login page
 * before anything renders. This only checks that the cookie exists (no
 * database call); every API route still verifies the session itself.
 */
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request, { cookiePrefix: AUTH_COOKIE_PREFIX })) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/properties/:path*", "/account/:path*"],
};
