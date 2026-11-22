/**
 * The customers' session cookie prefix (its name is "vrh.session_token", or
 * "__Secure-vrh.session_token" over HTTPS). Shared by Better Auth's server
 * config and the proxy, which only checks that the cookie exists.
 */
export const AUTH_COOKIE_PREFIX = "vrh";

/**
 * Staff's own cookie prefix ("vrh_admin.session_token"): the admin panel's
 * sign-in is separate from customers', so neither replaces the other.
 */
export const STAFF_COOKIE_PREFIX = "vrh_admin";
