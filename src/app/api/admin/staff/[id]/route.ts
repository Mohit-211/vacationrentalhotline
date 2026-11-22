import { staffUpdateSchema } from "@/lib/schemas/admin";
import { handler, noContent, ok, readBody, requireStaff } from "@/server/http";
import { changeStaffRole, deleteStaff, findStaff, updateUser } from "@/server/services/admin/accounts";
import { serializeStaff } from "@/server/services/admin/directory";

type Context = RouteContext<"/api/admin/staff/[id]">;

/**
 * PATCH /api/admin/staff/:id { name?, email?, role? }: a role change signs the
 * person out. You can't change your own role or demote the last admin.
 */
export const PATCH = handler(async (request: Request, context: Context) => {
  const staff = await requireStaff(request, "staff.manage");
  const member = await findStaff((await context.params).id);
  const { role, ...changes } = await readBody(request, staffUpdateSchema);
  if (role) await changeStaffRole(member, role, staff.user.id);
  return ok(serializeStaff(await updateUser(member.id, changes)));
});

/** DELETE /api/admin/staff/:id: not yourself, and not the last admin. */
export const DELETE = handler(async (request: Request, context: Context) => {
  const staff = await requireStaff(request, "staff.manage");
  await deleteStaff(await findStaff((await context.params).id), staff.user.id);
  return noContent();
});
