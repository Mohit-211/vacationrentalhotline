import "server-only";
import { z } from "zod";
import { auth, type Session } from "@/server/auth";
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
 * site, as browsers say in the Origin header. SameSite=Lax cookies already
 * stop most cross-site requests; this closes the rest.
 */
function assertTrustedOrigin(request: Request) {
  if (SAFE_METHODS.has(request.method) || !request.headers.has("cookie")) return;
  const origin = request.headers.get("origin");
  if (origin !== new URL(serverEnv().APP_URL).origin) {
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
