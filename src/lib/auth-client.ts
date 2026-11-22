import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { Auth } from "@/server/auth";

/**
 * Better Auth's browser client, for sign-up, sign-in, sign-out, the session,
 * email verification, password reset and change, and email change. It calls
 * this site's /api/auth; the session lives in an httpOnly cookie.
 */
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<Auth>()],
});

export const { useSession } = authClient;

interface AuthError {
  code?: string;
  message?: string;
  status?: number;
}

/** The emailed link itself is bad: it expired, was altered, or its account is gone. */
export function isBadLinkError(error: AuthError | null | undefined): boolean {
  return ["TOKEN_EXPIRED", "INVALID_TOKEN", "USER_NOT_FOUND"].includes(error?.code ?? "");
}

/** A message to show for a failed Better Auth call. */
export function authErrorMessage(error: AuthError | null | undefined): string {
  if (error?.status === 429) return "Too many attempts. Please wait a minute and try again.";
  switch (error?.code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "Invalid email or password. Please try again.";
    case "EMAIL_NOT_VERIFIED":
      return "Please verify your email first. We've sent you a new verification link.";
    case "INVALID_PASSWORD":
      return "Incorrect current password.";
    case "INVALID_TOKEN":
    case "TOKEN_EXPIRED":
      return "This link has expired. Please request a new one.";
    case "INVALID_USER":
      return "This link is for a different account. Log out, then open the link again.";
    case "BANNED_USER":
      return "This account has been suspended. Please contact us.";
  }
  return error?.message || "Something went wrong. Please try again.";
}
