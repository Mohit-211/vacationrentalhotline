import { handler, noContent, notFound, ok, readJson, requireUser } from "@/server/http";
import {
  deleteUserProperties,
  findUserProperty,
  listNotes,
  patchProperty,
  serializeProperty,
} from "@/server/services/properties";

type Context = RouteContext<"/api/properties/[id]">;

/** GET /api/properties/:id: one of the user's properties, with its notes. */
export const GET = handler(async (request: Request, context: Context) => {
  const user = await requireUser(request);
  const property = await findUserProperty(user.id, (await context.params).id);
  if (!property) throw notFound("Property");
  return ok({ ...serializeProperty(property), notes: await listNotes(property.id) });
});

/**
 * PATCH /api/properties/:id: changes the fields sent; null or "" clears an
 * optional one. The property as it would be saved must still be valid.
 */
export const PATCH = handler(async (request: Request, context: Context) => {
  const user = await requireUser(request);
  const property = await findUserProperty(user.id, (await context.params).id);
  if (!property) throw notFound("Property");
  return ok(serializeProperty(await patchProperty(property, await readJson(request))));
});

/** DELETE /api/properties/:id */
export const DELETE = handler(async (request: Request, context: Context) => {
  const user = await requireUser(request);
  const deleted = await deleteUserProperties(user.id, [(await context.params).id]);
  if (deleted === 0) throw notFound("Property");
  return noContent();
});
