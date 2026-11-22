import { passwordResetSchema } from "@/lib/schemas/admin";
import { handler, ok, readBody, requireStaff } from "@/server/http";
import { findCustomer, resetAccountPassword } from "@/server/services/admin/accounts";

type Context = RouteContext<"/api/admin/customers/[id]/password">;

/**
 * POST /api/admin/customers/:id/password { sendEmail? }: sets a new generated
 * password and signs the customer out everywhere. Returns the password once.
 */
export const POST = handler(async (request: Request, context: Context) => {
  await requireStaff(request, "customers.manage");
  const customer = await findCustomer((await context.params).id);
  const { sendEmail } = await readBody(request, passwordResetSchema);
  return ok({ password: await resetAccountPassword(customer, sendEmail) });
});
