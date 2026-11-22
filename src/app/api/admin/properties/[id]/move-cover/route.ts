import { moveCoverSchema } from "@/lib/schemas/admin";
import { handler, notFound, ok, readBody, requireStaff } from "@/server/http";
import { findProperty, getPropertyDetail } from "@/server/services/admin/directory";
import { moveCover } from "@/server/services/billing";

type Context = RouteContext<"/api/admin/properties/[id]/move-cover">;

/**
 * POST /api/admin/properties/:id/move-cover { toPropertyId }: moves this
 * property's paid cover to another of the customer's properties that isn't
 * covered, then deletes this one. Returns the newly covered property.
 */
export const POST = handler(async (request: Request, context: Context) => {
  await requireStaff(request, "billing.manage");
  const property = await findProperty((await context.params).id);
  if (!property) throw notFound("Property");
  const { toPropertyId } = await readBody(request, moveCoverSchema);
  await moveCover(property, toPropertyId);
  return ok(await getPropertyDetail((await findProperty(toPropertyId))!));
});
