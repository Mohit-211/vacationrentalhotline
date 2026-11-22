import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware, isAPIError } from "better-auth/api";
import { admin } from "better-auth/plugins/admin";
import type { z } from "zod";
import { AUTH_COOKIE_PREFIX } from "@/lib/auth-cookie";
import { personNameSchema, phoneNumberSchema } from "@/lib/schemas/common";
import { passwordSchema } from "@/lib/schemas/password";
import { db, schema } from "@/server/db";
import {
  emailChangedMessage,
  passwordChangedMessage,
  resetPasswordMessage,
  verifyEmailMessage,
  verifyNewEmailMessage,
  welcomeMessage,
} from "@/server/email/templates";
import { sendEmailInBackground } from "@/server/email/send";
import { serverEnv } from "@/server/env";

const DAY = 60 * 60 * 24;

/**
 * Reads the claims of an email-verification token (a JWT Better Auth has
 * already signed). Only used to pick which email to send; Better Auth
 * verifies the signature itself when the link is opened.
 */
function readTokenClaims(token: string | null | undefined): { email?: string; updateTo?: string; requestType?: string } {
  try {
    const payload = token?.split(".")[1];
    return payload ? JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) : {};
  } catch {
    return {};
  }
}

/** Rejects a request field that fails a shared form rule, with that rule's message. */
function check<T extends z.ZodType>(rule: T, value: unknown, code: string) {
  const result = rule.safeParse(value);
  if (!result.success) {
    throw new APIError("BAD_REQUEST", { code, message: result.error.issues[0]?.message ?? "Invalid value." });
  }
}

function createAuth() {
  const env = serverEnv();

  return betterAuth({
    appName: "Vacation Rental Hotline",
    baseURL: env.APP_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db(), { provider: "mysql", schema, usePlural: true, transaction: true }),
    telemetry: { enabled: false },

    advanced: {
      cookiePrefix: AUTH_COOKIE_PREFIX,
      database: { generateId: "uuid" },
    },

    // Profile changes go through /api/account, which validates the address
    // fields; account deletion isn't offered.
    disabledPaths: ["/update-user", "/delete-user"],

    user: {
      additionalFields: {
        phone: { type: "string", required: false, input: true },
      },
      changeEmail: { enabled: true },
    },

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      autoSignIn: false,
      revokeSessionsOnPasswordReset: true,
      resetPasswordTokenExpiresIn: 60 * 60,
      sendResetPassword: async ({ user, url }) => {
        // `url` is Better Auth's link: it checks the token, then redirects
        // to /reset-password?token=... (or ?error=INVALID_TOKEN).
        sendEmailInBackground(resetPasswordMessage(user.email, user.name, url));
      },
      onPasswordReset: async ({ user }) => {
        sendEmailInBackground(passwordChangedMessage(user.email, user.name));
      },
    },

    emailVerification: {
      sendOnSignUp: true,
      // Signing in before verifying sends a fresh link.
      sendOnSignIn: true,
      autoSignInAfterVerification: false,
      expiresIn: DAY,
      sendVerificationEmail: async ({ user, token }) => {
        // Both flows use this hook; an email change carries the new address
        // in `updateTo` and gets its own page and wording.
        const isEmailChange = readTokenClaims(token).requestType === "change-email-verification";
        const page = isEmailChange ? "verify-email-change" : "verify-email";
        const url = `${env.APP_URL}/${page}?token=${encodeURIComponent(token)}`;
        sendEmailInBackground(
          isEmailChange
            ? verifyNewEmailMessage(user.email, user.name, url)
            : verifyEmailMessage(user.email, user.name, url),
        );
      },
      afterEmailVerification: async (user, request) => {
        const claims = readTokenClaims(request ? new URL(request.url).searchParams.get("token") : null);
        if (claims.updateTo) {
          // An email change: tell the old address and the new one.
          if (claims.email) sendEmailInBackground(emailChangedMessage(claims.email, user.name, user.email));
          sendEmailInBackground(emailChangedMessage(user.email, user.name, user.email));
        } else {
          sendEmailInBackground(welcomeMessage(user.email, user.name));
        }
      },
    },

    verification: {
      // Store one-time tokens (password resets) hashed, not as readable links.
      storeIdentifier: "hashed",
    },

    rateLimit: {
      enabled: env.NODE_ENV === "production",
      // Shared by all server processes, unlike the default in-memory store.
      storage: "database",
    },

    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        switch (ctx.path) {
          case "/sign-up/email":
            check(personNameSchema, ctx.body?.name, "INVALID_NAME");
            if (ctx.body?.phone) check(phoneNumberSchema, ctx.body.phone, "INVALID_PHONE");
            check(passwordSchema, ctx.body?.password, "PASSWORD_TOO_WEAK");
            break;
          case "/reset-password":
          case "/change-password":
            check(passwordSchema, ctx.body?.newPassword, "PASSWORD_TOO_WEAK");
            break;
        }
      }),
      after: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== "/change-password") return;
        const returned = ctx.context.returned;
        if (!returned || isAPIError(returned) || typeof returned !== "object" || !("user" in returned)) return;
        const user = returned.user as { email: string; name: string };
        sendEmailInBackground(passwordChangedMessage(user.email, user.name));
      }),
    },

    plugins: [
      admin({
        defaultRole: "customer",
        adminRoles: ["admin"],
      }),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
export type Session = Auth["$Infer"]["Session"];

const globalForAuth = globalThis as typeof globalThis & { __vrhAuth?: Auth };

/** The Better Auth instance, created on first use (after the environment is read). */
export function auth(): Auth {
  if (!globalForAuth.__vrhAuth) {
    globalForAuth.__vrhAuth = createAuth();
  }
  return globalForAuth.__vrhAuth;
}
