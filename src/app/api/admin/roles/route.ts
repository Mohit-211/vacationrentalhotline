import { roleCreateSchema } from "@/lib/schemas/admin";
import { created, handler, ok, readBody, requireStaff } from "@/server/http";
import { createRole, listRoles } from "@/server/services/admin/roles";

/** GET /api/admin/roles: staff roles with their permissions and member counts. */
export const GET = handler(async (request: Request) => {
  await requireStaff(request, "staff.manage");
  return ok(await listRoles());
});

/** POST /api/admin/roles { name, label, permissions }: a new staff role. */
export const POST = handler(async (request: Request) => {
  await requireStaff(request, "staff.manage");
  return created(await createRole(await readBody(request, roleCreateSchema)));
});
