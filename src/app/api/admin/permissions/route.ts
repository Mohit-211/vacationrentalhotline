import { handler, ok, requireStaff } from "@/server/http";
import { listPermissions } from "@/server/services/admin/roles";

/** GET /api/admin/permissions: what a role can be allowed to do. */
export const GET = handler(async (request: Request) => {
  await requireStaff(request, "staff.manage");
  return ok(listPermissions());
});
