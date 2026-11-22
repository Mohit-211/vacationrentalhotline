import "server-only";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { ADMIN_ROLE, CUSTOMER_ROLE, PERMISSION_NAMES, type Permission } from "@/lib/permissions";
import { auth, type Session } from "@/server/auth";
import { db } from "@/server/db";
import { roles } from "@/server/db/schema";
import { serverEnv } from "@/server/env";

// Helpers shared by the API's route handlers.
//
// Every response is JSON. Success: `{ "data": ... }`. Failure:
// `{ "error": { "code": "NOT_FOUND", "message": "...", "fields"?: {...} } }`
// with a matching status: 400 invalid input, 401 not signed in, 403 not
// allowed, 404 not found (also for other people's records), 500 unexpected.

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fields?: Record<string, string[]>,
  ) {
    super(message);
  }
}

export const notFound = (what: string) => new HttpError(404, "NOT_FOUND", `${what} not found.`);

export function invalidFields(fields: Record<string, string[]>, message?: string): HttpError {
  const first = Object.values(fields)[0]?.[0];
  return new HttpError(400, "VALIDATION_FAILED", message ?? first ?? "Some fields are invalid.", fields);
}

/** Groups zod issues by field path ("properties.2.ownerEmail"). */
export function zodFields(error: z.ZodError, prefix: (string | number)[] = []): Record<string, string[]> {
  const fields: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = [...prefix, ...issue.path].join(".") || "_";
    (fields[key] ??= []).push(issue.message);
  }
  return fields;
}

export const ok = <T>(data: T, init?: ResponseInit) => Response.json({ data }, init);
export const created = <T>(data: T) => Response.json({ data }, { status: 201 });
export const noContent = () => new Response(null, { status: 204 });

const errorResponse = (error: HttpError) =>
  Response.json(
    { error: { code: error.code, message: error.message, ...(error.fields ? { fields: error.fields } : {}) } },
    { status: error.status },
  );

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Requests that change data and carry cookies must come from a page of this
 * site or of the admin panel, as browsers say in the Origin header.
 * SameSite=Lax cookies already stop most cross-site requests; this closes
 * the rest.
 */
function assertTrustedOrigin(request: Request) {
  if (SAFE_METHODS.has(request.method) || !request.headers.has("cookie")) return;
  const env = serverEnv();
  const origin = request.headers.get("origin");
  if (origin !== new URL(env.APP_URL).origin && origin !== env.ADMIN_APP_ORIGIN) {
    throw new HttpError(403, "INVALID_ORIGIN", "This request must come from the Vacation Rental Hotline site.");
  }
}

/**
 * Wraps a route handler: checks the origin of writes, and turns thrown
 * HttpErrors (and anything unexpected) into JSON error responses.
 */
export function handler<Args extends [Request, ...unknown[]]>(fn: (...args: Args) => Promise<Response>) {
  return async (...args: Args): Promise<Response> => {
    try {
      assertTrustedOrigin(args[0]);
      return await fn(...args);
    } catch (error) {
      if (error instanceof HttpError) return errorResponse(error);
      console.error(`[api] ${args[0].method} ${new URL(args[0].url).pathname} failed`, error);
      const stripeType = (error as { type?: unknown })?.type;
      if (typeof stripeType === "string" && stripeType.startsWith("Stripe")) {
        // Stripe refused or failed the request; the details are in the server log.
        return errorResponse(
          stripeType === "StripeAuthenticationError"
            ? new HttpError(503, "PAYMENTS_UNAVAILABLE", "Payments aren't available right now. Please try again later.")
            : new HttpError(502, "PAYMENT_PROVIDER_ERROR", "Our payment provider couldn't complete this. Please try again."),
        );
      }
      return errorResponse(new HttpError(500, "INTERNAL_ERROR", "Something went wrong. Please try again."));
    }
  };
}

/** Parses a JSON body, without validating it. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, "INVALID_JSON", "The request body must be valid JSON.");
  }
}

/** Parses and validates a JSON body. */
export async function readBody<T extends z.ZodType>(request: Request, schema: T): Promise<z.output<T>> {
  const result = schema.safeParse(await readJson(request));
  if (!result.success) throw invalidFields(zodFields(result.error));
  return result.data;
}

export type SessionUser = Session["user"];

/** The signed-in user, or a 401. */
export async function requireUser(request: Request): Promise<SessionUser> {
  const session = await auth().api.getSession({ headers: request.headers });
  if (!session) throw new HttpError(401, "UNAUTHENTICATED", "Please sign in to continue.");
  return session.user;
}

// ---- Staff ---------------------------------------------------------------------

export interface Staff {
  user: SessionUser;
  role: string;
  permissions: Permission[];
}

/**
 * The signed-in staff member, or 401 (not signed in) / 403 (a customer, or
 * a role without the permission). "admin" has every permission.
 */
export async function requireStaff(request: Request, permission?: Permission): Promise<Staff> {
  const user = await requireUser(request);
  const role = (user as SessionUser & { role?: string }).role ?? CUSTOMER_ROLE;
  if (role === CUSTOMER_ROLE) throw new HttpError(403, "FORBIDDEN", "This account can't use the admin panel.");
  let permissions: Permission[];
  if (role === ADMIN_ROLE) {
    permissions = PERMISSION_NAMES;
  } else {
    const [row] = await db().select().from(roles).where(eq(roles.name, role)).limit(1);
    permissions = (row?.permissions ?? []).filter((name): name is Permission => (PERMISSION_NAMES as string[]).includes(name));
  }
  if (permission && !permissions.includes(permission)) {
    throw new HttpError(403, "FORBIDDEN", "Your role doesn't allow this.");
  }
  return { user, role, permissions };
}

// ---- Paging ----------------------------------------------------------------------

export interface PageRequest {
  page: number;
  pageSize: number;
  offset: number;
}

/** ?page=1&pageSize=25 (at most 100). */
export function readPage(request: Request, defaultSize = 25): PageRequest {
  const params = new URL(request.url).searchParams;
  const page = Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(params.get("pageSize") ?? String(defaultSize), 10) || defaultSize));
  return { page, pageSize, offset: (page - 1) * pageSize };
}

/** A page of results: { data, meta: { page, pageSize, total } }. */
export const paged = <T>(data: T[], total: number, { page, pageSize }: PageRequest) =>
  Response.json({ data, meta: { page, pageSize, total } });
