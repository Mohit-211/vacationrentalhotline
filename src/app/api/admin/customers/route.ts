import { CUSTOMER_ROLE } from "@/lib/permissions";
import { customerCreateSchema } from "@/lib/schemas/admin";
import { created, handler, paged, readBody, readPage, requireStaff } from "@/server/http";
import { createAccount } from "@/server/services/admin/accounts";
import { listCustomers, serializeCustomer } from "@/server/services/admin/directory";

/** GET /api/admin/customers?search=&page=&pageSize=: customers, newest first, with property counts. */
export const GET = handler(async (request: Request) => {
  await requireStaff(request, "customers.view");
  const page = readPage(request);
  const { data, total } = await listCustomers(new URL(request.url).searchParams.get("search"), page);
  return paged(data, total, page);
});

/**
 * POST /api/admin/customers { name, email, phone?, sendEmail? }: creates a
 * verified customer with a generated password, emailed unless sendEmail is
 * false. The response carries the password once, for the admin to copy.
 */
export const POST = handler(async (request: Request) => {
  await requireStaff(request, "customers.manage");
  const input = await readBody(request, customerCreateSchema);
  const { user, password } = await createAccount({ ...input, role: CUSTOMER_ROLE });
  return created({ customer: serializeCustomer(user), password });
});
