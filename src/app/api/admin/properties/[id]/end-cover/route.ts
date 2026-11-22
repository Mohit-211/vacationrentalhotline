import { handler, notFound, ok, requireStaff } from "@/server/http";
import { findProperty, getPropertyDetail } from "@/server/services/admin/directory";
import { endCoverNow } from "@/server/services/billing";

type Context = RouteContext<"/api/admin/properties/[id]/end-cover">;

/**
 * POST /api/admin/properties/:id/end-cover: ends the property's cover now and
 * stops its renewal. Nothing is refunded by the app; refund by hand in
 * Stripe's dashboard if needed (the payment then shows the refund). The
 * customer gets the cover-ended email on the next jobs run.
 */
export const POST = handler(async (request: Request, context: Context) => {
  const staff = await requireStaff(request, "billing.manage");
  const property = await findProperty((await context.params).id);
  if (!property) throw notFound("Property");
  await endCoverNow(property, staff.user.id);
  return ok(await getPropertyDetail((await findProperty(property.id))!));
});
