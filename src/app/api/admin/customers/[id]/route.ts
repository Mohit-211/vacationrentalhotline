import { customerUpdateSchema } from "@/lib/schemas/admin";
import { handler, noContent, ok, readJson, requireStaff } from "@/server/http";
import { deleteCustomer, findCustomer, updateUser } from "@/server/services/admin/accounts";
import { getCustomerDetail, serializeCustomer } from "@/server/services/admin/directory";
import { accountChangesFrom } from "@/server/services/account";

type Context = RouteContext<"/api/admin/customers/[id]">;

/** GET /api/admin/customers/:id: the customer with their properties and payments. */
export const GET = handler(async (request: Request, context: Context) => {
  await requireStaff(request, "customers.view");
  return ok(await getCustomerDetail(await findCustomer((await context.params).id)));
});

/**
 * PATCH /api/admin/customers/:id: the profile fields the account page has,
 * plus the email (changed directly, without verification).
 */
export const PATCH = handler(async (request: Request, context: Context) => {
  await requireStaff(request, "customers.manage");
  const customer = await findCustomer((await context.params).id);
  const changes = accountChangesFrom(customer, await readJson(request), customerUpdateSchema);
  return ok(serializeCustomer(await updateUser(customer.id, changes)));
});

/**
 * DELETE /api/admin/customers/:id: ends the customer's live subscriptions
 * (no refund), then deletes the account with its properties and notes.
 */
export const DELETE = handler(async (request: Request, context: Context) => {
  await requireStaff(request, "customers.manage");
  await deleteCustomer(await findCustomer((await context.params).id));
  return noContent();
});
