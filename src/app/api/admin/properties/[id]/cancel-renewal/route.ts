import { handler, notFound, ok, requireStaff } from "@/server/http";
import { findProperty, getPropertyDetail } from "@/server/services/admin/directory";
import { stopRenewal } from "@/server/services/billing";

type Context = RouteContext<"/api/admin/properties/[id]/cancel-renewal">;

/**
 * POST /api/admin/properties/:id/cancel-renewal: stops the property renewing,
 * exactly as the customer can. It stays covered until its paid year ends;
 * nothing is refunded.
 */
export const POST = handler(async (request: Request, context: Context) => {
  const staff = await requireStaff(request, "billing.manage");
  const property = await findProperty((await context.params).id);
  if (!property) throw notFound("Property");
  await stopRenewal(property, staff.user.id);
  return ok(await getPropertyDetail((await findProperty(property.id))!));
});
