import { passwordResetSchema } from "@/lib/schemas/admin";
import { handler, ok, readBody, requireStaff } from "@/server/http";
import { findStaff, resetAccountPassword } from "@/server/services/admin/accounts";

type Context = RouteContext<"/api/admin/staff/[id]/password">;

/**
 * POST /api/admin/staff/:id/password { sendEmail? }: sets a new generated
 * password and signs them out everywhere. Returns the password once.
 */
export const POST = handler(async (request: Request, context: Context) => {
  await requireStaff(request, "staff.manage");
  const member = await findStaff((await context.params).id);
  const { sendEmail } = await readBody(request, passwordResetSchema);
  return ok({ password: await resetAccountPassword(member, sendEmail) });
});
