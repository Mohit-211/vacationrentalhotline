import { timingSafeEqual } from "node:crypto";
import { serverEnv } from "@/server/env";
import { HttpError, handler, ok } from "@/server/http";
import { runScheduledJobsOnce } from "@/server/jobs/scheduler";

/**
 * POST /api/jobs/run with "Authorization: Bearer <JOBS_SECRET>": runs the
 * scheduled jobs now (they also run by themselves every 15 minutes). Off
 * unless JOBS_SECRET is set.
 */
export const POST = handler(async (request: Request) => {
  const secret = serverEnv().JOBS_SECRET;
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const valid = secret && given.length === secret.length && timingSafeEqual(Buffer.from(given), Buffer.from(secret));
  if (!valid) throw new HttpError(404, "NOT_FOUND", "Not found.");
  const report = await runScheduledJobsOnce();
  if (!report) throw new HttpError(409, "ALREADY_RUNNING", "The jobs are already running.");
  return ok(report);
});
