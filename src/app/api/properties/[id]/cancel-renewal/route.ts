import { handler, notFound, ok, requireUser } from "@/server/http";
import { stopRenewal } from "@/server/services/billing";
import { findUserProperty, serializeProperty } from "@/server/services/properties";

type Context = RouteContext<"/api/properties/[id]/cancel-renewal">;

/**
 * POST /api/properties/:id/cancel-renewal: the property stops renewing. It
 * stays covered until the end of the year already paid; nothing is refunded.
 */
export const POST = handler(async (request: Request, context: Context) => {
  const user = await requireUser(request);
  const property = await findUserProperty(user.id, (await context.params).id);
  if (!property) throw notFound("Property");
  await stopRenewal(property, user.id);
  return ok(serializeProperty((await findUserProperty(user.id, property.id))!));
});
