import { PAYMENT_STATUSES } from "@/server/db/schema";
import { handler, invalidFields, paged, readPage, requireStaff } from "@/server/http";
import { listPayments } from "@/server/services/admin/directory";

/**
 * GET /api/admin/payments?search=&status=&customerId=&page=: payments (first
 * payments and renewals), newest first, with the properties each covered.
 */
export const GET = handler(async (request: Request) => {
  await requireStaff(request, "customers.view");
  const params = new URL(request.url).searchParams;
  const status = params.get("status");
  if (status && !(PAYMENT_STATUSES as readonly string[]).includes(status)) {
    throw invalidFields({ status: [`Use one of: ${PAYMENT_STATUSES.join(", ")}.`] });
  }
  const page = readPage(request);
  const { data, total } = await listPayments(
    { search: params.get("search"), status, customerId: params.get("customerId") },
    page,
  );
  return paged(data, total, page);
});
