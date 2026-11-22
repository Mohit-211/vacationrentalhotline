import { handler, ok, requireStaff } from "@/server/http";
import { dashboardStats } from "@/server/services/admin/stats";

/** GET /api/admin/stats?days=30: dashboard figures for the last 1-365 days (default 30), plus totals. */
export const GET = handler(async (request: Request) => {
  await requireStaff(request, "dashboard.view");
  const requested = Number.parseInt(new URL(request.url).searchParams.get("days") ?? "30", 10);
  const days = Math.min(365, Math.max(1, Number.isNaN(requested) ? 30 : requested));
  return ok(await dashboardStats(days));
});
