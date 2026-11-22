import "server-only";
import { z } from "zod";

// Server-side configuration, read from the environment and validated on
// first use. Validation is lazy so `next build` works without secrets; a
// missing or malformed value fails loudly the first time the server needs it.

/** An optional setting: unset and empty both mean "not configured". */
const optional = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);

const serverEnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    /** Public URL of this site, e.g. https://vacationrentalhotline.com */
    APP_URL: z.url().transform((url) => url.replace(/\/+$/, "")),
    /** mysql://user:password@host:3306/database */
    DATABASE_URL: z.string().startsWith("mysql://", "DATABASE_URL must be a mysql:// connection string"),
    BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
    /** "smtp" sends real email; "log" prints it to the server console. */
    MAIL_TRANSPORT: z.enum(["smtp", "log"]).optional(),
    SMTP_HOST: optional,
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_USERNAME: optional,
    SMTP_PASSWORD: optional,
    EMAIL_FROM: z.string().trim().min(1).default("Vacation Rental Hotline <no-reply@vacationrentalhotline.com>"),
  })
  .transform((env) => ({
    ...env,
    MAIL_TRANSPORT: env.MAIL_TRANSPORT ?? (env.NODE_ENV === "production" ? "smtp" : "log"),
  }))
  .superRefine((env, ctx) => {
    if (env.MAIL_TRANSPORT === "smtp" && !env.SMTP_HOST) {
      ctx.addIssue({
        code: "custom",
        path: ["SMTP_HOST"],
        message: 'SMTP_HOST is required when MAIL_TRANSPORT is "smtp"',
      });
    }
  });

export type ServerEnv = z.output<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

export function serverEnv(): ServerEnv {
  if (!cached) {
    const result = serverEnvSchema.safeParse(process.env);
    if (!result.success) {
      throw new Error(`Invalid server environment:\n${z.prettifyError(result.error)}`);
    }
    cached = result.data;
  }
  return cached;
}
