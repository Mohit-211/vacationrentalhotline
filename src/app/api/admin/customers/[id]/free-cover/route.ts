import { freeCoverSchema } from "@/lib/schemas/admin";
import { handler, ok, readBody, requireStaff } from "@/server/http";
import { findCustomer } from "@/server/services/admin/accounts";
import { getCustomerDetail } from "@/server/services/admin/directory";
import { removeFreeCover, setFreeCover } from "@/server/services/billing";

type Context = RouteContext<"/api/admin/customers/[id]/free-cover">;

/**
 * PUT /api/admin/customers/:id/free-cover { properties }: free cover for up to
 * that many properties. All the customer's properties are covered at no
 * charge, and they can't add more than the limit. 409 TOO_MANY_PROPERTIES if
 * they already have more.
 */
export const PUT = handler(async (request: Request, context: Context) => {
  await requireStaff(request, "billing.manage");
  const customer = await findCustomer((await context.params).id);
  const { properties } = await readBody(request, freeCoverSchema);
  await setFreeCover(customer.id, properties);
  return ok(await getCustomerDetail((await findCustomer(customer.id))));
});

/**
 * DELETE /api/admin/customers/:id/free-cover: ends free cover. Properties not
 * covered by a payment become inactive at once, and the customer is told.
 */
export const DELETE = handler(async (request: Request, context: Context) => {
  await requireStaff(request, "billing.manage");
  const customer = await findCustomer((await context.params).id);
  const { uncovered } = await removeFreeCover(customer.id);
  return ok({ uncovered, customer: await getCustomerDetail((await findCustomer(customer.id))) });
});
