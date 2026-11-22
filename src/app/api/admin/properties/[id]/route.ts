import { handler, noContent, notFound, ok, readJson, requireStaff } from "@/server/http";
import { findProperty, getPropertyDetail } from "@/server/services/admin/directory";
import { deletePropertiesById, patchProperty, serializeProperty } from "@/server/services/properties";

type Context = RouteContext<"/api/admin/properties/[id]">;

async function propertyFrom(context: Context) {
  const property = await findProperty((await context.params).id);
  if (!property) throw notFound("Property");
  return property;
}

/** GET /api/admin/properties/:id: the property, its customer, notes, subscription and payments. */
export const GET = handler(async (request: Request, context: Context) => {
  await requireStaff(request, "customers.view");
  return ok(await getPropertyDetail(await propertyFrom(context)));
});

/** PATCH /api/admin/properties/:id: same rules as the customer's own edit. */
export const PATCH = handler(async (request: Request, context: Context) => {
  await requireStaff(request, "customers.manage");
  return ok(serializeProperty(await patchProperty(await propertyFrom(context), await readJson(request))));
});

/** DELETE /api/admin/properties/:id: 409 while it's covered (end the cover first). */
export const DELETE = handler(async (request: Request, context: Context) => {
  await requireStaff(request, "customers.manage");
  await deletePropertiesById([(await propertyFrom(context)).id]);
  return noContent();
});
