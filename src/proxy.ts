import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { AUTH_COOKIE_PREFIX } from "@/lib/auth-cookie";

// Runs before every matched request (Node.js runtime).

/** The admin panel's origin, which may call the API with cookies. */
const adminOrigin = () => {
  try {
    return process.env.ADMIN_APP_ORIGIN ? new URL(process.env.ADMIN_APP_ORIGIN).origin : null;
  } catch {
    return null;
  }
};

const corsHeaders = (origin: string) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "600",
  Vary: "Origin",
});

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API: let the admin panel's origin call it with the session cookie.
  if (pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin");
    const allowed = adminOrigin();
    if (!origin || origin !== allowed) return NextResponse.next();
    if (request.method === "OPTIONS") return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
    const response = NextResponse.next();
    for (const [name, value] of Object.entries(corsHeaders(origin))) response.headers.set(name, value);
    return response;
  }

  // Signed-in pages send visitors without a session cookie to the login page
  // before anything renders. This only checks that the cookie exists (no
  // database call); every API route still verifies the session itself.
  if (!getSessionCookie(request, { cookiePrefix: AUTH_COOKIE_PREFIX })) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/properties/:path*", "/account/:path*", "/api/:path*"],
};
