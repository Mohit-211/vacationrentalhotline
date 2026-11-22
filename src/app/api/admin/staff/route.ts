import { staffCreateSchema } from "@/lib/schemas/admin";
import { created, handler, ok, readBody, requireStaff } from "@/server/http";
import { assertRoleExists, createAccount } from "@/server/services/admin/accounts";
import { listStaff, serializeStaff } from "@/server/services/admin/directory";

/** GET /api/admin/staff: staff accounts, by name. */
export const GET = handler(async (request: Request) => {
  await requireStaff(request, "staff.manage");
  return ok(await listStaff());
});

/**
 * POST /api/admin/staff { name, email, role, sendEmail? }: creates a staff
 * account with a generated password, emailed unless sendEmail is false. The
 * response carries the password once, for the admin to copy.
 */
export const POST = handler(async (request: Request) => {
  await requireStaff(request, "staff.manage");
  const input = await readBody(request, staffCreateSchema);
  await assertRoleExists(input.role, { staff: true });
  const { user, password } = await createAccount(input);
  return created({ staff: serializeStaff(user), password });
});
