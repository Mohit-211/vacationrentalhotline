import { handler, invalidFields, paged, readPage, requireStaff } from "@/server/http";
import { listAllProperties } from "@/server/services/admin/directory";
import { PROPERTY_STATUSES, type PropertyStatus } from "@/server/services/properties";

/**
 * GET /api/admin/properties?search=&status=active|inactive&customerId=&page=:
 * every customer's properties, newest first. Search covers the owner's
 * name, emails and phone, the address, and the customer's name and email.
 */
export const GET = handler(async (request: Request) => {
  await requireStaff(request, "customers.view");
  const params = new URL(request.url).searchParams;
  const status = params.get("status");
  if (status && !(PROPERTY_STATUSES as readonly string[]).includes(status)) {
    throw invalidFields({ status: ['Use "active" or "inactive".'] });
  }
  const page = readPage(request);
  const { data, total } = await listAllProperties(
    { search: params.get("search"), status: status as PropertyStatus | null, customerId: params.get("customerId") },
    page,
  );
  return paged(data, total, page);
});
