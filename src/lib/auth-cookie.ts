/**
 * The session cookie's prefix (its name is "vrh.session_token", or
 * "__Secure-vrh.session_token" over HTTPS). Shared by Better Auth's server
 * config and the proxy, which only checks that the cookie exists.
 */
export const AUTH_COOKIE_PREFIX = "vrh";
