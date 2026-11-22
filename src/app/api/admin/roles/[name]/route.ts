import { roleUpdateSchema } from "@/lib/schemas/admin";
import { handler, noContent, ok, readBody, requireStaff } from "@/server/http";
import { deleteRole, updateRole } from "@/server/services/admin/roles";

type Context = RouteContext<"/api/admin/roles/[name]">;

/** PATCH /api/admin/roles/:name { label?, permissions? }: any role but admin. */
export const PATCH = handler(async (request: Request, context: Context) => {
  await requireStaff(request, "staff.manage");
  return ok(await updateRole((await context.params).name, await readBody(request, roleUpdateSchema)));
});

/** DELETE /api/admin/roles/:name: custom roles nobody has. */
export const DELETE = handler(async (request: Request, context: Context) => {
  await requireStaff(request, "staff.manage");
  await deleteRole((await context.params).name);
  return noContent();
});
