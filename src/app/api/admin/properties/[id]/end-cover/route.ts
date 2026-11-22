import { endCoverSchema } from "@/lib/schemas/admin";
import { handler, notFound, ok, readBody, requireStaff } from "@/server/http";
import { findProperty, getPropertyDetail } from "@/server/services/admin/directory";
import { endCoverNow } from "@/server/services/billing";

type Context = RouteContext<"/api/admin/properties/[id]/end-cover">;

/**
 * POST /api/admin/properties/:id/end-cover { refund: "none" | "prorated" | "full" }:
 * ends the property's cover now and stops its renewal. "prorated" refunds
 * the unused days of the last payment for this property; "full" refunds all
 * of it. The customer gets the cover-ended email on the next jobs run.
 */
export const POST = handler(async (request: Request, context: Context) => {
  const staff = await requireStaff(request, "billing.manage");
  const property = await findProperty((await context.params).id);
  if (!property) throw notFound("Property");
  const { refund } = await readBody(request, endCoverSchema);
  const { refundedCents } = await endCoverNow(property, staff.user.id, refund);
  return ok({ refundedCents, property: await getPropertyDetail((await findProperty(property.id))!) });
});
